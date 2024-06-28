import React from 'react';

const Chatbot = ({ character, setCharacter, questions, setQuestions }) => {
    const handleCharacterChange = (e) => {
        const { name, value } = e.target;
        setCharacter(prevState => ({ ...prevState, [name]: value }));
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        setQuestions(prevState => ({ ...prevState, [name]: value }));
    };

    return (
        <div className="chatbot-page-container">
            <h1 className="chatbot-page-title">Chatbot</h1>
            <div className="chatbot-section">
                <label className="chatbot-label">
                    Onset:
                    <input className="chatbot-input" type="text" name="onset" value={questions.onset} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Provocation:
                    <input className="chatbot-input" type="text" name="provocation" value={questions.provocation} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Quality:
                    <input className="chatbot-input" type="text" name="quality" value={questions.quality} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Region:
                    <input className="chatbot-input" type="text" name="region" value={questions.region} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Severity:
                    <input className="chatbot-input" type="text" name="severity" value={questions.severity} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Time:
                    <input className="chatbot-input" type="text" name="time" value={questions.time} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Signs and Symptoms:
                    <input className="chatbot-input" type="text" name="signsSymptoms" value={questions.signsSymptoms} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Allergies:
                    <input className="chatbot-input" type="text" name="allergies" value={questions.allergies} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Medication:
                    <input className="chatbot-input" type="text" name="medication" value={questions.medication} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Previous Medical History:
                    <input className="chatbot-input" type="text" name="previousMedicalHistory" value={questions.previousMedicalHistory} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Last Oral Intake:
                    <input className="chatbot-input" type="text" name="lastOralIntake" value={questions.lastOralIntake} onChange={handleQuestionChange} />
                </label>
                <label className="chatbot-label">
                    Events Leading Up:
                    <input className="chatbot-input" type="text" name="eventsLeadingUp" value={questions.eventsLeadingUp} onChange={handleQuestionChange} />
                </label>
            </div>
        </div>
    );
};

export default Chatbot;
