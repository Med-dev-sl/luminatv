import React from 'react';

const Button = ({ children, type = 'button', onClick, style }) => {
  const defaultStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#61dafb',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
    ...style,
  };

  return (
    <button type={type} onClick={onClick} style={defaultStyle}>
      {children}
    </button>
  );
};

export default Button;
