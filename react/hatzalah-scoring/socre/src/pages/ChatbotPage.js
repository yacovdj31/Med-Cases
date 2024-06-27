// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Chatbot from '../components/Chatbot';

// const ChatbotPage = () => {
//     const navigate = useNavigate();
//     const [questions, setQuestions] = useState({
//         onset: '',
//         provocation: '',
//         quality: '',
//         region: '',
//         severity: '',
//         time: '',
//         signsSymptoms: '',
//         allergies: '',
//         medication: '',
//         previousMedicalHistory: '',
//         lastOralIntake: '',
//         eventsLeadingUp: ''
//     });

//     const handleSubmit = () => {
//         localStorage.setItem('questions', JSON.stringify(questions));
//         navigate('/vitals-input');
//     };

//     return (
//         <div>
//             <Chatbot
//                 questions={questions}
//                 setQuestions={setQuestions}
//             />
//             <button onClick={handleSubmit}>Next</button>
//         </div>
//     );
// };

// export default ChatbotPage;




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';

const ChatbotPage = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState(() => {
        const savedQuestions = localStorage.getItem('questions');
        return savedQuestions ? JSON.parse(savedQuestions) : {
            onset: '',
            provocation: '',
            quality: '',
            region: '',
            severity: '',
            time: '',
            signsSymptoms: '',
            allergies: '',
            medication: '',
            previousMedicalHistory: '',
            lastOralIntake: '',
            eventsLeadingUp: ''
        };
    });

    const handleSubmit = () => {
        localStorage.setItem('questions', JSON.stringify(questions));
        navigate('/vitals-input');
    };

    return (
        <div className="chatbot-page-container">
            <Chatbot
                questions={questions}
                setQuestions={setQuestions}
            />
            <button className="chatbot-button" onClick={handleSubmit}>Next</button>
        </div>
    );
};

export default ChatbotPage;
