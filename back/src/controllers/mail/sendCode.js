const nodemailer = require('nodemailer');

const sendCode = async (req, res, next) => {
    try {
        // 1. Extraer y validar los datos del correo desde req.body
        const { to, text } = req.body;
        console.log("aqui");
        console.log(to);

        if (!to) {
            return res.status(400).json({ error: 'Destinatario y asunto son obligatorios' });
        };

        const min = 10000;
        const max = 99999;

        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        const messageHtml = `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>¡Bienvenido a Casa Novedad!</title>
                    <style>
                        body {
                        font-family: sans-serif;
                        background-color: #f4f4f4;
                        }

                        .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 5px;
                        }

                        h1 {
                        color: #007bff;
                        }

                        p {
                        line-height: 1.6;
                        }

                        .btn {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>¡Hola! 👋</h1>
                        <p>¡Gracias por registrarte en Casa Novedad!</p>
                        <p>Tu código de verificación es:</p>
                        <h2 style="text-align: center; font-size: 24px; margin: 20px 0;">${randomNumber}</h2> 
                        <p>Por favor, ingresa este código en nuestro sitio web para completar tu registro.</p>
                        <a href="https://www.casanovedad.com" class="btn">Visitar Casa Novedad</a>
                        <p>¡Esperamos que disfrutes de tu experiencia con nosotros!</p>
                    </div>
                </body>
            </html>`


        // 2. Construir las opciones del correo (mailOptions)
        const mailOptions = {
            from: 'test@casanovedad.com',
            to,
            subject: 'Código de verificación',
            text,
            html: messageHtml
        };

        const transporter = nodemailer.createTransport({
            host: 'mail.casanovedad.com', 
            port: 465, 
            secure: true, 
            auth: {
                user: 'test@casanovedad.com', 
                pass: '21@mK0tUl9'
            }
        });

        // 3. Enviar el correo usando el transporter
        const info = await transporter.sendMail(mailOptions);

        // 4. Enviar respuesta de éxito al frontend
        return res.status(200).json({ message: 'Correo enviado correctamente', info, code: randomNumber }); 
    } catch (error) {
        // 5. Manejo de errores (log en consola y pasar al middleware de errores)
        console.error('Error al enviar correo:', error);
        next(error); // Esto permite que otro middleware maneje el error (si lo tienes configurado)
    }
};

module.exports = { sendCode };