import { Op } from 'sequelize';
import { subDays, startOfDay } from 'date-fns';

import Student from '../models/Student';
import Checkin from '../models/Checkin';

class CheckinController {
  async index(req, res) {
    const student_id = req.params.id;

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(404).json({ error: "Student don't exists" });
    }

    const checkins = await Checkin.findAll({
      where: {
        student_id,
      },
      order: [['id', 'DESC']],
    });

    return res.json(checkins);
  }

  async store(req, res) {
    const student_id = req.params.id;

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(404).json({ error: "Student don't exists" });
    }

    // Checkins 7 days
    const checkount = await Checkin.findAll({
      where: {
        student_id,
        created_at: {
          [Op.gte]: startOfDay(subDays(new Date(), 7)),
        },
      },
    });

    if (checkount.length > 4) {
      return res
        .status(401)
        .json({ error: 'Number of checkins reached during 7 days' });
    }

    // Checkins daily
    const { count } = await Checkin.findAndCountAll({
      where: {
        student_id,
        created_at: {
          [Op.gte]: startOfDay(new Date()),
        },
      },
    });

    if (count > 0) {
      return res.status(401).json({ error: 'Daily checkin was done' });
    }

    const checkin = await Checkin.create({
      student_id,
    });

    return res.json(checkin);
  }
}

export default new CheckinController();
