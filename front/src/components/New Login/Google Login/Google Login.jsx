import { useDispatch } from "react-redux";
import styles from "./Google Login.module.css";
import { GoogleLogin } from "react-google-login";
import { auth_google_Login } from "../../../redux/actions";

const Google_Login = ({ setGoogleAccessToken, modeSingUp }) => {
    const dispatch = useDispatch();

    const clientId = "1027048250245-li9gor30unv7ieg8tkk77fpbh78cahbs.apps.googleusercontent.com";
    
    const onSuccess = (res) => {
        dispatch(auth_google_Login({ token: res.tokenObj.id_token }));
        setGoogleAccessToken(res);
    };

    const onFailure = (res) => {
        console.log("LOGIN FAILED! res: ", res);
    };
    
    return (
        <div id={styles.signInButton}>
            <GoogleLogin
                clientId={clientId}
                buttonText={modeSingUp ? "Sign Up with Google" : "Sign In with Google"}
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                isSignedIn={true}
            />
        </div>
    );
};

export { Google_Login };