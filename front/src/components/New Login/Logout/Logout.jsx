import { useDispatch } from "react-redux";
import styles from "./Logout.module.css";
import { GoogleLogout } from 'react-google-login';
import { logout } from "../../../redux/actions";
import { useNavigate } from "react-router-dom";

const Logout = ({ setSignIn, googleAccessToken, setGoogleAccessToken }) => {
    const clientId = "1027048250245-li9gor30unv7ieg8tkk77fpbh78cahbs.apps.googleusercontent.com";

    const dispatch = useDispatch();
    const navigate = useNavigate()
    
    const onLogoutSuccess = () => {
        setGoogleAccessToken(null)
        setSignIn(false);
        dispatch(logout());
        navigate("/")
        localStorage.clear()
    };
    
    return (
        <>
            {googleAccessToken
                ? <GoogleLogout
                    className={styles.logout_google}
                    clientId={clientId}
                    buttonText="Logout"
                    onLogoutSuccess={onLogoutSuccess}
                />
                : <button className={styles.logout_google} onClick={onLogoutSuccess}>Logout</button>
            }
        </>
    );
};

export { Logout };