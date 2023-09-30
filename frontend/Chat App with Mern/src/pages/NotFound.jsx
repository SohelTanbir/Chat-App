import React from 'react';

const NotFound = () => {
    return (
        <div className='flex items-center justify-center w-full h-screen'>
            <div className='text-center'>
                <h1 className='font-bold text-6xl text-primary block'>404</h1>
                <p className='text-black font-medium'> Page not found!</p>
            </div>
        </div>
    );
};

export default NotFound;