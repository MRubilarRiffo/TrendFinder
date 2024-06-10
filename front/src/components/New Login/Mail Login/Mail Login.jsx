import { useEffect, useState } from "react";
import styles from "./Mail Login.module.css";
import { useDispatch } from "react-redux";
import { auth_mail_Login, addUser } from "../../../redux/actions";
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const Mail_Login = ({ modeSingUp }) => {
    const dispatch = useDispatch();
    
    const [visiblePassword, setVisiblePassword] = useState(false);
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
        }
    };

    const handleChange = ({ target: { name, value } }) => {
        setUser({
            ...user,
            [name]: value
        });
    };

    return (
        <form id={styles.form} onSubmit={handleSubmit}>
            {modeSingUp &&
                <div id={styles.name_lastName}>
                    <input
                        name="name"
                        type="text"
                        placeholder="Name"
                        value={user.name}
                        onChange={handleChange}
                    />
                    <input
                        name="last_name"
                        type="text"
                        placeholder="Last Name"
                        value={user.last_name}
                        onChange={handleChange}
                    />
                </div>}
                <div id={styles.mail_lastName}>
                    <input
                        name="mail"
                        type="mail"
                        placeholder="Mail"
                        value={user.mail}
                        onChange={handleChange}
                    />
                </div>
            <div id={styles.container_password}>
                <input
                    id={styles.input_password}
                    name="password"
                    type={visiblePassword ? "text" : "password"}
                    placeholder="Password"
                    value={user.password}
                    onChange={handleChange}
                />
                <button
                    onClick={() => setVisiblePassword(!visiblePassword)}
                    id={styles.button_password}
                    type="button"
                    >
                        {visiblePassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                    </button>
            </div>

            <button type="submit">{modeSingUp ? "Sign Up" : "Sign In"}</button>
        </form>
    );
};

export { Mail_Login };