// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import CheckVitals from '../components/CheckVitals';

// const vitals = [
//     'Oxygen',
//     'BPM',
//     'BP',
//     'BreathingRate',
//     'Glucose'
// ];

// const CheckVitalsPage = () => {
//     const navigate = useNavigate();
//     const [vitalsCheck, setVitalsCheck] = useState(
//         vitals.reduce((acc, vital) => ({ ...acc, [vital]: '' }), {})
//     );

//     const handleSubmit = () => {
//         localStorage.setItem('vitalsCheck', JSON.stringify(vitalsCheck));
//         navigate('/summary');
//     };

//     return (
//         <div>
//             <CheckVitals vitalsCheck={vitalsCheck} setVitalsCheck={setVitalsCheck} />
//             <button onClick={() => navigate(-1)}>Back</button>
//             <button onClick={handleSubmit}>Next</button>
//         </div>
//     );
// };

// export default CheckVitalsPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckVitals from '../components/CheckVitals';

const vitals = [
    'Oxygen',
    'BPM',
    'BP',
    'BreathingRate',
    'Glucose'
];

const CheckVitalsPage = () => {
    const navigate = useNavigate();
    const [vitalsCheck, setVitalsCheck] = useState(
        vitals.reduce((acc, vital) => ({ ...acc, [vital]: '' }), {})
    );

    const handleSubmit = () => {
        localStorage.setItem('vitalsCheck', JSON.stringify(vitalsCheck));
        navigate('/scoring');
    };

    return (
        <div>
            <CheckVitals vitalsCheck={vitalsCheck} setVitalsCheck={setVitalsCheck} />
            <button onClick={() => navigate(-1)}>Back</button>
            <button onClick={handleSubmit}>Next</button>
        </div>
    );
};

export default CheckVitalsPage;
