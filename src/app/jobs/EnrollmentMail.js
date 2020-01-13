import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import numeral from 'numeral';

import Mail from '../../lib/Mail';

class EnrollmentEmail {
  get key() {
    return 'EnrollmentEmail';
  }

  async handle({ data }) {
    const { enrollment } = data;

    await Mail.sendMail({
      to: `${enrollment.student.name} <${enrollment.student.email}>`,
      subject: 'Matrícula na GYM Point',
      template: 'enrollment',
      context: {
        student: enrollment.student.name,
        plan: enrollment.plan.title,
        duration: enrollment.plan.duration,
        monthly: numeral(enrollment.plan.price).format('$0,0.00'),
        price: numeral(enrollment.price).format('$0,0.00'),
        start_date: format(
          parseISO(enrollment.start_date),
          "dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
        end_date: format(
          parseISO(enrollment.end_date),
          "dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
        created_at: format(
          parseISO(enrollment.created_at),
          "dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new EnrollmentEmail();
