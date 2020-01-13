import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class HelpOrderQuestionEmail {
  get key() {
    return 'HelpOrderQuestionEmail';
  }

  async handle({ data }) {
    const { insHelpOrder } = data;

    await Mail.sendMail({
      to: `${insHelpOrder.student.name} <${insHelpOrder.student.email}>`,
      subject: 'GYM Point - Serviço de Atendimento ao Cliente',
      template: 'help-order-question',
      context: {
        student: insHelpOrder.student.name,
        id: insHelpOrder.id,
        question: insHelpOrder.question,
        created_at: format(
          parseISO(insHelpOrder.created_at),
          "dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new HelpOrderQuestionEmail();
