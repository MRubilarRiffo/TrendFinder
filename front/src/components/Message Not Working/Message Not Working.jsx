import { container } from './Message Not Working.module.css';

const MessageNotWorking = ({ message }) => {
    return (
        <div className={container}>
            <p>{message}</p>
        </div>
    );
};

export { MessageNotWorking };