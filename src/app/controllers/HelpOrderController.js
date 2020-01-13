import * as Yup from 'yup';

import Student from '../models/Student';
import HelpOrder from '../models/HelpOrder';

import HelpOrderQuestionMail from '../jobs/HelpOrderQuestionMail';
import HelpOrderAnswerEmail from '../jobs/HelpOrderAnswerEmail';
import Queue from '../../lib/Queue';

class HelpOrderController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const student_id = req.params.id;

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(404).json({ error: "Student don't exists" });
    }

    const helpOrders = await HelpOrder.findAll({
      where: {
        student_id,
      },
      order: [['id', 'DESC']],
      attributes: ['id', 'question', 'answer', 'answer_at', 'created_at'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.json(helpOrders);
  }

  async store(req, res) {
    // Check student
    const student_id = req.params.id;

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(404).json({ error: "Student don't exists" });
    }

    // Check body
    const schema = Yup.object().shape({
      question: Yup.string()
        .required()
        .min(3),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { question } = req.body;

    const helpOrder = await HelpOrder.create({
      student_id,
      question,
    });

    const insHelpOrder = await HelpOrder.findByPk(helpOrder.id, {
      attributes: ['id', 'question', 'created_at'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    await Queue.add(HelpOrderQuestionMail.key, {
      insHelpOrder,
    });

    return res.json(insHelpOrder);
  }

  async update(req, res) {
    // Check student
    const { id } = req.params;

    const helpOrder = await HelpOrder.findByPk(id, {
      attributes: ['id', 'question', 'answer', 'answer_at', 'created_at'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!helpOrder) {
      return res.status(404).json({ error: "Help Order don't exists" });
    }

    // Check answer
    if (helpOrder.answer != null) {
      return res.status(400).json({ error: 'Help Order already answered' });
    }

    // Validation body
    const schema = Yup.object().shape({
      answer: Yup.string()
        .required()
        .min(3),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { answer } = req.body;

    const updHelpOrder = await helpOrder.update({
      answer,
      answer_at: new Date(),
    });

    await Queue.add(HelpOrderAnswerEmail.key, {
      updHelpOrder,
    });

    return res.json(updHelpOrder);
  }

  async show(req, res) {
    const { page = 1 } = req.query;

    const helpOrders = await HelpOrder.findAll({
      where: {
        answer: null,
      },
      order: [['id']],
      attributes: ['id', 'question', 'answer', 'answer_at', 'created_at'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.json(helpOrders);
  }
}

export default new HelpOrderController();
