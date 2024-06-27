// import React from 'react';

// const VitalsInput = ({ initialVitals, setInitialVitals, perfectVitals, setPerfectVitals, worseVitals, setWorseVitals }) => {
//     const handleChange = (e, setVitals, vitals) => {
//         const { name, value } = e.target;
//         setVitals({
//             ...vitals,
//             [name]: value
//         });
//     };

//     return (
//         <div className="vitals-input-page">
//             <h1>Initial Vitals</h1>
//             <div className="vitals-list">
//                 {Object.keys(initialVitals).map((vital) => (
//                     <div key={vital} className="vital-entry">
//                         <label>{vital}:</label>
//                         <input
//                             type="text"
//                             name={vital}
//                             value={initialVitals[vital]}
//                             onChange={(e) => handleChange(e, setInitialVitals, initialVitals)}
//                         />
//                     </div>
//                 ))}
//             </div>

//             <h1>Perfect Vitals</h1>
//             <div className="vitals-list">
//                 {Object.keys(perfectVitals).map((vital) => (
//                     <div key={vital} className="vital-entry">
//                         <label>{vital}:</label>
//                         <input
//                             type="text"
//                             name={vital}
//                             value={perfectVitals[vital]}
//                             onChange={(e) => handleChange(e, setPerfectVitals, perfectVitals)}
//                         />
//                     </div>
//                 ))}
//             </div>

//             <h1>Worse Vitals</h1>
//             <div className="vitals-list">
//                 {Object.keys(worseVitals).map((vital) => (
//                     <div key={vital} className="vital-entry">
//                         <label>{vital}:</label>
//                         <input
//                             type="text"
//                             name={vital}
//                             value={worseVitals[vital]}
//                             onChange={(e) => handleChange(e, setWorseVitals, worseVitals)}
//                         />
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default VitalsInput;



import React from 'react';

const VitalsInput = ({ initialVitals, setInitialVitals, perfectVitals, setPerfectVitals, worseVitals, setWorseVitals }) => {
    const handleChange = (e, setVitals, vitals) => {
        const { name, value } = e.target;
        setVitals({
            ...vitals,
            [name]: value.slice(0, 3)
        });
    };

    return (
        <div className="vitals-input-page">
            <h1>Initial Vitals</h1>
            <div className="vitals-list">
                {Object.keys(initialVitals).map((vital) => (
                    <div key={vital} className="vital-entry">
                        <label>{vital}:</label>
                        {vital === 'BP' ? (
                            <>
                                <input
                                    type="text"
                                    name="BP1"
                                    value={initialVitals['BP1']}
                                    onChange={(e) => handleChange(e, setInitialVitals, initialVitals)}
                                    maxLength="3"
                                />
                                <span>/</span>
                                <input
                                    type="text"
                                    name="BP2"
                                    value={initialVitals['BP2']}
                                    onChange={(e) => handleChange(e, setInitialVitals, initialVitals)}
                                    maxLength="3"
                                />
                            </>
                        ) : (
                            <input
                                type="text"
                                name={vital}
                                value={initialVitals[vital]}
                                onChange={(e) => handleChange(e, setInitialVitals, initialVitals)}
                                maxLength="3"
                            />
                        )}
                        {vital === 'Oxygen' && <span>%</span>}
                        {vital === 'Glucose' && <span>mg/dL</span>}
                    </div>
                ))}
            </div>

            <h1>Perfect Vitals</h1>
            <div className="vitals-list">
                {Object.keys(perfectVitals).map((vital) => (
                    <div key={vital} className="vital-entry">
                        <label>{vital}:</label>
                        {vital === 'BP' ? (
                            <>
                                <input
                                    type="text"
                                    name="BP1"
                                    value={perfectVitals['BP1']}
                                    onChange={(e) => handleChange(e, setPerfectVitals, perfectVitals)}
                                    maxLength="3"
                                />
                                <span>/</span>
                                <input
                                    type="text"
                                    name="BP2"
                                    value={perfectVitals['BP2']}
                                    onChange={(e) => handleChange(e, setPerfectVitals, perfectVitals)}
                                    maxLength="3"
                                />
                            </>
                        ) : (
                            <input
                                type="text"
                                name={vital}
                                value={perfectVitals[vital]}
                                onChange={(e) => handleChange(e, setPerfectVitals, perfectVitals)}
                                maxLength="3"
                            />
                        )}
                        {vital === 'Oxygen' && <span>%</span>}
                        {vital === 'Glucose' && <span>mg/dL</span>}
                    </div>
                ))}
            </div>

            <h1>Worse Vitals</h1>
            <div className="vitals-list">
                {Object.keys(worseVitals).map((vital) => (
                    <div key={vital} className="vital-entry">
                        <label>{vital}:</label>
                        {vital === 'BP' ? (
                            <>
                                <input
                                    type="text"
                                    name="BP1"
                                    value={worseVitals['BP1']}
                                    onChange={(e) => handleChange(e, setWorseVitals, worseVitals)}
                                    maxLength="3"
                                />
                                <span>/</span>
                                <input
                                    type="text"
                                    name="BP2"
                                    value={worseVitals['BP2']}
                                    onChange={(e) => handleChange(e, setWorseVitals, worseVitals)}
                                    maxLength="3"
                                />
                            </>
                        ) : (
                            <input
                                type="text"
                                name={vital}
                                value={worseVitals[vital]}
                                onChange={(e) => handleChange(e, setWorseVitals, worseVitals)}
                                maxLength="3"
                            />
                        )}
                        {vital === 'Oxygen' && <span>%</span>}
                        {vital === 'Glucose' && <span>mg/dL</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VitalsInput;
