import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import To, Mail

def set_mail_content(**kwargs):
    message = Mail(
        from_email='fary.hey.nurse@gmail.com',
        to_emails=kwargs['to_email']
    )
    message.dynamic_template_data = kwargs['template_data']
    message.template_id = kwargs['template_id']
    return message

def email_send(**kwargs):
    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        message = set_mail_content(**kwargs)
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        return response.status_code
    except Exception as e:
        return ({'error':e}, 400)