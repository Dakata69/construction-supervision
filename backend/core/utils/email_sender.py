from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags


def send_credentials_email(user, temporary_password):
    """Send credentials email with username and temporary password"""
    subject = 'Construction Supervision - Вашия профил е създаден'
    
    context = {
        'first_name': user.first_name or 'User',
        'username': user.username,
        'email': user.email,
        'temporary_password': temporary_password,
        'frontend_url': settings.FRONTEND_URL,
    }
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 4px; text-align: center; }}
            .content {{ padding: 20px; background: #f9f9f9; }}
            .credentials {{ background: white; padding: 15px; border-left: 4px solid #1890ff; margin: 15px 0; }}
            .credentials-row {{ margin: 10px 0; }}
            .label {{ font-weight: bold; color: #1890ff; }}
            .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; }}
            .button {{ display: inline-block; background: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Construction Supervision</h1>
            </div>
            
            <div class="content">
                <p>Добър ден <strong>{context['first_name']}</strong>,</p>
                
                <p>От фирма Construction Supervision е създаден вашия профил. По-долу намирате вашите данни за вход:</p>
                
                <div class="credentials">
                    <div class="credentials-row">
                        <span class="label">Потребителско име:</span> <strong>{context['username']}</strong>
                    </div>
                    <div class="credentials-row">
                        <span class="label">Временна парола:</span> <strong>{context['temporary_password']}</strong>
                    </div>
                </div>
                
                <p>Използвайте горните данни, за да се впишете в системата:</p>
                
                <center>
                    <a href="{context['frontend_url']}/login" class="button">Отворете систематата</a>
                </center>
                
                <p style="color: #999; font-size: 13px;">
                    <strong>Забележка:</strong> Препоръчваме да смените парола при първи вход в системата за по-голяма сигурност.
                </p>
            </div>
            
            <div class="footer">
                <p>© Construction Supervision Team. Всички права запазени.</p>
                <p>Това е автоматично генериран имейл. Моля не отговарайте.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_reset_email(user, reset_token):
    """Send password reset email with token link"""
    subject = 'Construction Supervision - Възстановяване на парола'
    
    reset_url = f"{settings.FRONTEND_URL}/password-reset/{reset_token.token}"
    
    context = {
        'first_name': user.first_name or 'User',
        'reset_url': reset_url,
        'expires_hours': 24,
    }
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 4px; text-align: center; }}
            .content {{ padding: 20px; background: #f9f9f9; }}
            .button {{ display: inline-block; background: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0; }}
            .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Construction Supervision</h1>
            </div>
            
            <div class="content">
                <p>Добър ден <strong>{context['first_name']}</strong>,</p>
                <p>Получихме запитване за възстановяване на вашата парола. Щракнете на връзката по-долу, за да зададете нова парола:</p>
                
                <center>
                    <a href="{context['reset_url']}" class="button">Възстановяване на парола</a>
                </center>
                
                <p>Или копирайте и вставете тази връзка в браузъра си:</p>
                <p style="word-break: break-all; font-size: 12px; color: #666;">{context['reset_url']}</p>
                
                <p style="color: #999; font-size: 13px;">
                    Тази връзка ще бъде валидна {context['expires_hours']} часа.
                </p>
                
                <p>Ако не сте поискали възстановяване на парола, моля игнорирайте този имейл.</p>
            </div>
            
            <div class="footer">
                <p>© Construction Supervision Team. Всички права запазени.</p>
                <p>Това е автоматично генериран имейл. Моля не отговарайте.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )
