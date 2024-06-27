// // import React, { useState } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import Order from './Order';

// // const OrderPage = () => {
// //     const navigate = useNavigate();
// //     const [orderConfig, setOrderConfig] = useState(
// //         defaultItems.reduce((acc, item) => ({ ...acc, [item]: null }), {})
// //     );

// //     const handleSubmit = () => {
// //         localStorage.setItem('orderConfig', JSON.stringify(orderConfig));
// //         navigate('/check-vitals');
// //     };

// //     return (
// //         <div>
// //             <Order orderConfig={orderConfig} setOrderConfig={setOrderConfig} />
// //             <button onClick={() => navigate(-1)}>Back</button>
// //             <button onClick={handleSubmit}>Next</button>
// //         </div>
// //     );
// // };

// // export default OrderPage;


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Order from './Order';

// const defaultItems = [
//     'Pulse Oximeter',
//     'Stethoscope-BP',
//     'Tourniquet',
//     'Inhaler',
//     'Epinephrine',
//     'Oxygen tank',
//     'Non-Rebreather',
//     'Stethoscope-Breathing',
//     'Supine Position With Feet Raised',
//     'Supine Position',
//     'CPAP',
//     'Insulin',
//     'Cervical Collar',
//     'IV',
//     'Nitroglycerin',
//     'Tripod Position',
//     'Triangle Bandage',
//     'Glucometer',
//     'Listen-Breathing',
//     'Package Gauze',
//     'Thermometer',
//     'Epinephrine',
//     'Aspirin',
//     'Antiseptic Wipes',
//     'Antihistamines',
//     'Cold Packs',
//     'Heat Packs',
//     'Tweezers',
//     'Scissors',
//     'Glucogel',
//     'Fowler Position',
//     'Thermal Blanket',
//     'Flashlight',
//     'Surgical Gloves'
// ];

// const OrderPage = () => {
//     const navigate = useNavigate();
//     const [orderConfig, setOrderConfig] = useState(
//         defaultItems.reduce((acc, item) => ({ ...acc, [item]: null }), {})
//     );

//     const handleSubmit = () => {
//         localStorage.setItem('orderConfig', JSON.stringify(orderConfig));
//         navigate('/check-vitals');
//     };

//     return (
//         <div>
//             <Order orderConfig={orderConfig} setOrderConfig={setOrderConfig} />
//             <button onClick={() => navigate(-1)}>Back</button>
//             <button onClick={handleSubmit}>Next</button>
//         </div>
//     );
// };

// export default OrderPage;



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Order from '../components/Order';

const defaultItems = [
    'Pulse Oximeter',
    'Stethoscope-BP',
    'Tourniquet',
    'Inhaler',
    'Epinephrine',
    'Oxygen tank',
    'Non-Rebreather',
    'Stethoscope-Breathing',
    'Supine Position With Feet Raised',
    'Supine Position',
    'CPAP',
    'Insulin',
    'Cervical Collar',
    'IV',
    'Nitroglycerin',
    'Tripod Position',
    'Triangle Bandage',
    'Glucometer',
    'Listen-Breathing',
    'Package Gauze',
    'Thermometer',
    'Epinephrine',
    'Aspirin',
    'Antiseptic Wipes',
    'Antihistamines',
    'Cold Packs',
    'Heat Packs',
    'Tweezers',
    'Scissors',
    'Glucogel',
    'Fowler Position',
    'Thermal Blanket',
    'Flashlight',
    'Surgical Gloves'
];

const OrderPage = () => {
    const navigate = useNavigate();
    const [orderConfig, setOrderConfig] = useState(
        defaultItems.reduce((acc, item) => ({ ...acc, [item]: null }), {})
    );

    const handleSubmit = () => {
        localStorage.setItem('orderConfig', JSON.stringify(orderConfig));
        navigate('/check-vitals');
    };

    return (
        <div>
            <Order orderConfig={orderConfig} setOrderConfig={setOrderConfig} />
            <button onClick={() => navigate(-1)}>Back</button>
            <button onClick={handleSubmit}>Next</button>
        </div>
    );
};

export default OrderPage;

