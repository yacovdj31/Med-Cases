// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import ItemUsage from '../components/ItemUsage';

// const ItemUsagePage = ({ itemUsage, setItemUsage }) => {
//     const navigate = useNavigate();

//     const handleSubmit = () => {
//         localStorage.setItem('itemUsage', JSON.stringify(itemUsage));
//         navigate('/application');
//     };

//     return (
//         <div>
//             <ItemUsage setItemUsage={setItemUsage} />
//             <button onClick={() => navigate(-1)}>Back</button>
//             <button onClick={handleSubmit}>Next</button>
//         </div>
//     );
// };

// export default ItemUsagePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemUsage from '../components/ItemUsage';

const ItemUsagePage = ({ setItemUsage }) => {
    const navigate = useNavigate();
    const [localItemUsage, setLocalItemUsage] = useState(
        JSON.parse(localStorage.getItem('itemUsage')) || {}
    );

    const handleSubmit = () => {
        localStorage.setItem('itemUsage', JSON.stringify(localItemUsage));
        setItemUsage(localItemUsage);
        navigate('/application');
    };

    return (
        <div>
            <ItemUsage setItemUsage={setLocalItemUsage} />
            <button onClick={() => navigate(-1)}>Back</button>
            <button onClick={handleSubmit}>Next</button>
        </div>
    );
};

export default ItemUsagePage;
