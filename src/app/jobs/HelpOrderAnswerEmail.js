import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class HelpOrderAnswerEmail {
  get key() {
    return 'HelpOrderAnswerEmail';
  }

  async handle({ data }) {
    const { updHelpOrder } = data;

    await Mail.sendMail({
      to: `${updHelpOrder.student.name} <${updHelpOrder.student.email}>`,
      subject: 'GYM Point - Serviço de Atendimento ao Cliente',
      template: 'help-order-answer',
      context: {
        student: updHelpOrder.student.name,
        id: updHelpOrder.id,
        question: updHelpOrder.question,
        answer: updHelpOrder.answer,
        created_at: format(
          parseISO(updHelpOrder.created_at),
          "dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
        answer_at: format(
          parseISO(updHelpOrder.answer_at),
          "dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new HelpOrderAnswerEmail();
