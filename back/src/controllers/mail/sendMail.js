const nodemailer = require('nodemailer');

const sendMail = async (req, res, next) => {
    try {
        // 1. Extraer y validar los datos del correo desde req.body
        const { to, subject, text, html } = req.body;

        if (!to || !subject) {
            return res.status(400).json({ error: 'Destinatario y asunto son obligatorios' });
        }

        // 2. Construir las opciones del correo (mailOptions)
        const mailOptions = {
            from: 'test@casanovedad.com', // Tu dirección de correo
            to,
            subject,
            text, // Si solo quieres enviar texto plano
            html // Si quieres enviar HTML (prioriza html sobre text)
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
        return res.status(200).json({ message: 'Correo enviado correctamente', info }); 
    } catch (error) {
        // 5. Manejo de errores (log en consola y pasar al middleware de errores)
        console.error('Error al enviar correo:', error);
        next(error); // Esto permite que otro middleware maneje el error (si lo tienes configurado)
    }
};

module.exports = { sendMail };