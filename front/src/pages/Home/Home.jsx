import { container, form, nameAndLastName, passwordContainer, mailContainer, link, headerForm, errorMessage, codeVerification, mailVerification } from './Home.module.css';
import { useEffect, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Logo } from '../../components/Logo/Logo';
import { sendCodeVerification, userSession } from '../../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import validations from '../../functions/validations';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { status, token } = useSelector((state) => state.user);
    const { message, code } = useSelector((state) => state.codeVerification);

    useEffect(() => {
        if (status === "success" && token) navigate('/dashboard');
    }, [status, token]);

    const [errors, setErrors] = useState({});
    const [visiblePassword, setVisiblePassword] = useState(false);
    const [modeSingUp, setModeSingUp] = useState(false);
    const [user, setUser] = useState({ mail: "", password: "", name: "", lastName: "" });
    const [codeEmail, setCodeEmail] = useState(Array(5).fill(''));

    useEffect(() => {
        setUser({ mail: "", password: "", name: "", lastName: "" });
    }, [modeSingUp]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const rules = modeSingUp ? {
            name: { type: 'string', required: true, length: { min: 2, max: 30 } },
            lastName: { type: 'string', required: true, length: { min: 2, max: 30 } },
            password: { type: 'string', required: true, length: { min: 8 } },
            mail: { type: 'mail', required: true }
        } : {
            password: { type: 'string', required: true, length: { min: 8 } },
            mail: { type: 'mail', required: true }
        };

        const validationErrors = validations(user, rules);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        };

        if (parseInt(codeEmail.join('')) !== code) {
            setErrors(prev => ({ ...prev, code: "Código incorrecto" }));
            return;
        };

        setErrors({});

        try {
            if (modeSingUp) {
                // await dispatch(addUser(user));
                // await dispatch(auth_mail_Login(user));
            } else {
                dispatch(userSession(user.mail, user.password));
            };
        } catch (error) {
            console.error("Error al iniciar sesión/registrarse:", error);
            setErrors({ general: "Ocurrió un error al procesar la solicitud" }); 
        };
    };

    const handleChange = ({ target: { name, value } }) => {
        setUser({
            ...user,
            [name]: value
        });
    };

    const handleModeSingUp = () => {
        setErrors({});
        setModeSingUp(!modeSingUp);
    };

    console.log(code);
    console.log(codeEmail.join(''));

    const handleCodeEmailChange = (index, newValue) => {
        const newValues = [...codeEmail];
        newValues[index] = newValue;
        setCodeEmail(newValues);
    };

    const handleSendCode = () => {
        const rules = { mail: { type: 'mail', required: true } };

        const validationErrors = validations(user, rules);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...validationErrors }));
            return;
        };

        dispatch(sendCodeVerification(user.mail));
    };

    return (
        <div className={container}>
            <div>
                <Logo />
                <h3>Bienvenido a DropiSpy</h3>
            </div>
            <div>
                <form className={form} onSubmit={handleSubmit}>
                    {modeSingUp ? (
                        <div className={headerForm}>
                            <h3>Crea una cuenta</h3>
                            <p>¿Ya tienes cuenta? <span className={link} onClick={handleModeSingUp}>Inicia Sesión</span></p>
                        </div>
                    ) : (
                        <div className={headerForm}>
                            <h3>Inicia Sesión</h3>
                            <p>¿Aún no tienes una cuenta? <span className={link} onClick={handleModeSingUp}>Regístrate</span></p>
                        </div>
                    )}
                    {modeSingUp &&
                    <div className={nameAndLastName}>
                        <div>
                            {errors.name && <p className={errorMessage}>{errors.name}</p>}
                            <input
                                name="name"
                                type="text"
                                placeholder="Nombre"
                                value={user.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            {errors.lastName && <p className={errorMessage}>{errors.lastName}</p>}
                            <input
                                name="lastName"
                                type="text"
                                placeholder="Apellidos"
                                value={user.lastName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    }
                    <div className={mailContainer}>
                        {errors.mail && <p className={errorMessage}>{errors.mail}</p>}
                        <input
                            name="mail"
                            type="mail"
                            placeholder="Correo Electrónico"
                            value={user.mail}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={passwordContainer}>
                        {errors.password && <p className={errorMessage}>{errors.password}</p>}
                        {errors.codeEmail && <p className={errorMessage}>{errors.codeEmail}</p>}
                        <input
                            name="password"
                            type={visiblePassword ? "text" : "password"}
                            placeholder="Contraseña"
                            value={user.password}
                            onChange={handleChange}
                        />
                        <div
                            onClick={() => setVisiblePassword(!visiblePassword)}
                            type="button"
                            >
                                {visiblePassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                        </div>
                    </div>
                    <div className={mailVerification}>
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
                    <button type="submit" >{modeSingUp ? "Regístrate" : "Iniciar Sesión"}</button>
                </form>
            </div>
        </div>
    );
};

export { Home };
