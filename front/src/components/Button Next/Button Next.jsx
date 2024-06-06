import { MdOutlineNavigateBefore  } from 'react-icons/md';
import { buttonContainer, right } from './Button Next.module.css';

const ButtonNext = ({ onClick, condition }) => {
    return (
        <div className={`${buttonContainer} ${condition && right}`} onClick={onClick} >
            <MdOutlineNavigateBefore />
        </div>
    );
};

export { ButtonNext };