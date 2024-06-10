import { useSelector } from "react-redux";
import { Logout } from "../Logout/Logout";
import styles from "./Menu Login.module.css"
import { Link } from "react-router-dom";

const Menu_Login = ({ setSignIn, googleAccessToken, setGoogleAccessToken, setMenuOn }) => {
    const { user: { administrator } } = useSelector(state => state.auth_token);
    
    const handleClick = () => {
        setMenuOn(false);
    };

    return (
        <div id={styles.menu_login}>
            <Link onClick={handleClick} to={'/my-account/orders'}>Orders</Link>
            <Link onClick={handleClick} to={'/favorites'}>Favorites</Link>
            <Link onClick={handleClick} to={'/cart'}>Cart</Link>
            <Link onClick={handleClick} to={'/my-account'}>Account</Link>
            {administrator && <Link onClick={handleClick} to={'/admin'}>Admin</Link>}
            <Logout
                setSignIn={setSignIn}
                googleAccessToken={googleAccessToken}
                setGoogleAccessToken={setGoogleAccessToken}
                />
        </div>
    );
};

export { Menu_Login };