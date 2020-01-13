import { addMonths, parseISO } from 'date-fns';
import * as Yup from 'yup';

import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';

import EnrollmentMail from '../jobs/EnrollmentMail';
import Queue from '../../lib/Queue';

class EnrollmentCotroler {
  async index(req, res) {
    const { page = 1 } = req.query;

    const enrollments = await Enrollment.findAll({
      order: ['id'],
      attributes: ['id', 'start_date', 'end_date', 'price'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });

    return res.json(enrollments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number()
        .required()
        .positive(),
      plan_id: Yup.number()
        .required()
        .positive(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;

    // Check student
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ error: "Student don't exists" });
    }

    // Check enrollment
    const enrollmentFound = await Enrollment.findOne({
      where: {
        student_id,
      },
    });
    if (enrollmentFound) {
      return res.status(401).json({ error: 'Enrollment already exists' });
    }

    // Check plan
    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: "Plan don't exists" });
    }

    const end_date = addMonths(parseISO(start_date), plan.duration);
    const price = plan.price * plan.duration;

    const enrollmentCreate = await Enrollment.create({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    const enrollment = await Enrollment.findByPk(enrollmentCreate.id, {
      attributes: ['id', 'start_date', 'end_date', 'price', 'created_at'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });

    await Queue.add(EnrollmentMail.key, {
      enrollment,
    });

    return res.json(enrollment);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number()
        .required()
        .positive(),
      student_id: Yup.number()
        .required()
        .positive(),
      plan_id: Yup.number()
        .required()
        .positive(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, student_id, plan_id, start_date } = req.body;

    // Check enrollment
    const enrollmentFound = await Enrollment.findByPk(id);
    if (!enrollmentFound) {
      return res.status(404).json({ error: "Enrollment don't exists" });
    }

    // Check student
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ error: "Student don't exists" });
    }

    // Check plan
    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: "Plan don't exists" });
    }

    const end_date = addMonths(parseISO(start_date), plan.duration);
    const price = plan.price * plan.duration;

    const enrollment = await enrollmentFound.update({
      id,
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    return res.json(enrollment);
  }

  async delete(req, res) {
    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id);

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment don't exists" });
    }

    await enrollment.destroy();

    // 204 No Content
    return res.status(204).send();
  }
}

export default new EnrollmentCotroler();
