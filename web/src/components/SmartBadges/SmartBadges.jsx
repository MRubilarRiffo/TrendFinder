import styles from './SmartBadges.module.css';

const SmartBadges = ({ isBreakout, isHighTicket, isDeclining, hasLowStock }) => {
    return (
        <div className={styles.badgesWrapper}>
            {isBreakout && <span className={styles.breakoutBadge}>🔥 Despegue</span>}
            {isHighTicket && <span className={styles.highTicketBadge}>💎 High Ticket</span>}
            {isDeclining && <span className={styles.decliningBadge}>🧊 En Declive</span>}
            {hasLowStock && <span className={styles.lowStockBadge}>⚠️ Poco Stock</span>}
        </div>
    );
};

export default SmartBadges;
