import { useDispatch, useSelector } from 'react-redux';
import { sendCodeVerification } from '../../redux/actions';
import { container, codeVerification, header } from './Code Verification.module.css';
import { useState } from 'react';

const CodeVerification = ({ modeSingUp }) => {
    const dispatch = useDispatch();

    const [codeEmail, setCodeEmail] = useState(Array(5).fill(''));

    const { message, code } = useSelector((state) => state.codeVerification);

    const handleSendCode = () => {
        const rules = { mail: { type: 'mail', required: true } };

        const validationErrors = validations(user, rules);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...validationErrors }));
            return;
        };

        dispatch(sendCodeVerification(user.mail));
    };

    const handleCodeEmailChange = (index, newValue) => {
        const newValues = [...codeEmail];
        newValues[index] = newValue;
        setCodeEmail(newValues);
    };

    return (
        <div className={container}>
            <div className={header}>
                <h3>Verificación de cuenta</h3>
                <p>Ingresa el código de 5 dígitos que enviamos a tu correo electrónico para completar el {modeSingUp ? 'registro' : 'inicio de sesión'}.</p>
            </div>
            <div className={codeVerification}>
                {codeEmail.map((value, index) => (
                    <input
                        key={index} 
                        type="text"
                        value={value}
                        onChange={(e) => handleCodeEmailChange(index, e.target.value)}
                    />
                ))}
            </div>
            <button
                type="button"
                onClick={handleSendCode}
            >
                Enviar código
            </button>
        </div>
    );
};

export { CodeVerification };
