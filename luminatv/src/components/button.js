
const Button = ({ children, type = 'button', onClick, style }) => {
    const defaultStyle = {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#7260d4',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '1rem',
        width: '100%',
        ...style,
    };

    return (
        <button type={type} onClick={onClick} style={defaultStyle}>
            {children}
        </button>
    );
};

export default Button;
