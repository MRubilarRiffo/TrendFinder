import { container, form, nameAndLastName, passwordContainer, mailContainer, link } from './Home.module.css';
import { useEffect, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Logo } from '../../components/Logo/Logo';

const Home = () => {
    const [visiblePassword, setVisiblePassword] = useState(false);
    const [modeSingUp, setModeSingUp] = useState(false);
    const [user, setUser] = useState({
        mail: "",
        password: "",
        name: "",
        last_name: ""
    });

    useEffect(() => {
        setUser({
            mail: "",
            password: "",
            name: "",
            last_name: ""
        });
    }, [modeSingUp]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if(modeSingUp) {
            await dispatch(addUser(user));
            await dispatch(auth_mail_Login(user));
        } else {
            dispatch(auth_mail_Login(user));
        };
    };

    const handleChange = ({ target: { name, value } }) => {
        setUser({
            ...user,
            [name]: value
        });
    };

    const handleModeSingUp = () => {
        setModeSingUp(!modeSingUp);
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
                        <div>
                            <h3>Crea una cuenta</h3>
                            <p>¿Ya tienes cuenta? <span className={link} onClick={handleModeSingUp}>Inicia Sesión</span></p>
                        </div>
                    ) : (
                        <div>
                            <h3>Inicia Sesión</h3>
                            <p>¿Aún no tienes una cuenta? <span className={link} onClick={handleModeSingUp}>Regístrate</span></p>
                        </div>
                    )}
                    {modeSingUp &&
                    <div className={nameAndLastName}>
                        <input
                            name="name"
                            type="text"
                            placeholder="Nombre"
                            value={user.name}
                            onChange={handleChange}
                        />
                        <input
                            name="last_name"
                            type="text"
                            placeholder="Apellidos"
                            value={user.last_name}
                            onChange={handleChange}
                        />
                    </div>
                    }
                    <div className={mailContainer}>
                        <input
                            name="mail"
                            type="mail"
                            placeholder="Correo Electrónico"
                            value={user.mail}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={passwordContainer}>
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
                    <button type="submit">{modeSingUp ? "Regístrate" : "Iniciar Sesión"}</button>
                </form>
            </div>
        </div>
    );
};

export { Home };
