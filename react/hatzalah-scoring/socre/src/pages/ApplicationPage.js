import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Application from '../components/Application'; // Adjust the import path if necessary

const ApplicationPage = ({ itemUsage }) => {
    const navigate = useNavigate();
    const [applicationInputs, setApplicationInputs] = useState(
        JSON.parse(localStorage.getItem('applicationInputs')) || itemUsage
    );

    useEffect(() => {
        setApplicationInputs(itemUsage);
    }, [itemUsage]);

    const handleSubmit = () => {
        localStorage.setItem('applicationInputs', JSON.stringify(applicationInputs));
        navigate('/order');
    };

    return (
        <div>
            <Application itemUsage={itemUsage} setApplicationInputs={setApplicationInputs} />
            <button onClick={() => navigate(-1)}>Back</button>
            <button onClick={handleSubmit}>Next</button>
        </div>
    );
};

export default ApplicationPage;
