import React from 'react';
import PropTypes from 'prop-types';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import styles from '../styles/Button.module.css';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled = false, 
    onClick, 
    type = 'button',
    className = '',
    ...props 
}) => {
    return (
        <button
            type={type}
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <AiOutlineLoading3Quarters className={styles.spinner} />
            ) : (
                children
            )}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['primary', 'accent', 'danger', 'outline']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    type: PropTypes.string,
    className: PropTypes.string,
};

export default Button;
