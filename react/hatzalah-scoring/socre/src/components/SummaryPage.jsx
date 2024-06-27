// import React from 'react';

// const SummaryPage = () => {
//     const summaryData = JSON.parse(localStorage.getItem('summaryData')) || {};
//     const questions = JSON.parse(localStorage.getItem('questions')) || {};
//     const itemUsage = JSON.parse(localStorage.getItem('itemUsage')) || {};
//     const applicationInputs = JSON.parse(localStorage.getItem('applicationInputs')) || {};
//     const orderConfig = JSON.parse(localStorage.getItem('orderConfig')) || [];
//     const vitalsCheck = JSON.parse(localStorage.getItem('vitalsCheck')) || {};

//     const filteredApplicationInputs = Object.fromEntries(
//         Object.entries(applicationInputs).filter(([key, values]) => !(values.length === 1 && values[0] === 0))
//     );

//     const formatApplicationInputs = (inputs) => {
//         let itemString = `case ${summaryData.id}: // ${summaryData.dispatchCall}\n`;
//         Object.entries(inputs).forEach(([itemName, values]) => {
//             if (values.length === 0 || (values.length === 1 && values[0] === 0)) {
//                 return;
//             }
//             itemString += `if (itemName === "${itemName}") {\n`;

//             values.forEach((value, idx) => {
//                 if (value !== 0) {
//                     itemString += `  if (itemClickCount[itemName] === ${idx + 1}) adjustment = ${value};\n`;
//                 }
//             });

//             itemString += `}\n`;
//         });
//         return itemString;
//     };

//     const formattedApplicationInputs = formatApplicationInputs(filteredApplicationInputs);

//     const formatOrderConfig = (orderConfig) => {
//         console.log('orderConfig:', orderConfig); // Log the value of orderConfig
//         let orderString = `case ${summaryData.id}: // ${summaryData.dispatchCall}\npossibleOrders: [\n`;
//         if (Array.isArray(orderConfig)) {
//             orderConfig.forEach(order => {
//                 orderString += `  { order: [${order.items.map(item => `"${item}"`).join(', ')}], score: ${order.score} },\n`;
//             });
//         }
//         orderString += '],\n';
//         orderString += `incorrectScore: 0,\n`;
//         orderString += `flexibleCounts: {},\n`;
//         orderString += `nonEffectItems: []\n`;
//         return orderString;
//     };

//     const formattedOrderConfig = formatOrderConfig(orderConfig);

//     const formattedSummary = `
// {
//   id: ${summaryData.id},
//   character: ${JSON.stringify(summaryData.character, null, 2)},
//   dispatchCall: "${summaryData.dispatchCall}",
//   diagnosis: "${summaryData.diagnosis}",
//   category: "${summaryData.category}",
//   initialHealthLevel: ${summaryData.initialHealthLevel},
//   maxHealthLevel: ${summaryData.maxHealthLevel},
//   initialVitals: {
//     BPM: "${summaryData.initialVitals.BPM}",
//     Oxygen: "${summaryData.initialVitals.Oxygen}",
//     Glucose: "${summaryData.initialVitals.Glucose}",
//     BreathingRate: "${summaryData.initialVitals.BreathingRate}",
//     BP: "${summaryData.initialVitals.BP}"
//   },
//   perfectVitals: {
//     BPM: "${summaryData.perfectVitals.BPM}",
//     Oxygen: "${summaryData.perfectVitals.Oxygen}",
//     Glucose: "${summaryData.perfectVitals.Glucose}",
//     BreathingRate: "${summaryData.perfectVitals.BreathingRate}",
//     BP: "${summaryData.perfectVitals.BP}"
//   },
//   worseVitals: {
//     BPM: "${summaryData.worseVitals.BPM}",
//     Oxygen: "${summaryData.worseVitals.Oxygen}",
//     Glucose: "${summaryData.worseVitals.Glucose}",
//     BreathingRate: "${summaryData.worseVitals.BreathingRate}",
//     BP: "${summaryData.worseVitals.BP}"
//   },



//   applicationInputs: 
// \`
// ${formattedApplicationInputs}
// \`,
//   orderConfig: 
// \`
// ${formattedOrderConfig}
// \`,
// itemUsage: ${JSON.stringify(itemUsage, null, 2)},
// vitalsCheck: ${JSON.stringify(vitalsCheck, null, 2)}
// questions: ${JSON.stringify(questions, null, 2)},
// }`;

//     return (
//         <div className="summary-page">
//             <h1>Summary</h1>
//             <div>
//                 <h2>Formatted Summary for Copy/Paste</h2>
//                 <pre>{formattedSummary}</pre>
//             </div>
//         </div>
//     );
// };

// export default SummaryPage;

import React from 'react';

const SummaryPage = () => {
    const summaryData = JSON.parse(localStorage.getItem('summaryData')) || {};
    const questions = JSON.parse(localStorage.getItem('questions')) || {};
    const itemUsage = JSON.parse(localStorage.getItem('itemUsage')) || {};
    const applicationInputs = JSON.parse(localStorage.getItem('applicationInputs')) || {};
    const orderConfig = JSON.parse(localStorage.getItem('orderConfig')) || [];
    const vitalsCheck = JSON.parse(localStorage.getItem('vitalsCheck')) || {};

    const filteredApplicationInputs = Object.fromEntries(
        Object.entries(applicationInputs).filter(([key, values]) => !(values.length === 1 && values[0] === 0))
    );

    const formatApplicationInputs = (inputs) => {
        let itemString = `case ${summaryData.id}: // ${summaryData.dispatchCall}\n`;
        Object.entries(inputs).forEach(([itemName, values]) => {
            if (values.length === 0 || (values.length === 1 && values[0] === 0)) {
                return;
            }
            itemString += `if (itemName === "${itemName}") {\n`;

            values.forEach((value, idx) => {
                if (value !== 0) {
                    itemString += `  if (itemClickCount[itemName] === ${idx + 1}) adjustment = ${value};\n`;
                }
            });

            itemString += `}\n`;
        });
        return itemString;
    };

    const formattedApplicationInputs = formatApplicationInputs(filteredApplicationInputs);

    const formatOrderConfig = (orderConfig) => {
        console.log('orderConfig:', orderConfig); // Log the value of orderConfig
        let orderString = `case ${summaryData.id}: // ${summaryData.dispatchCall}\npossibleOrders: [\n`;
        if (Array.isArray(orderConfig)) {
            orderConfig.forEach(order => {
                orderString += `  { order: [${order.items.map(item => `"${item}"`).join(', ')}], score: ${order.score} },\n`;
            });
        }
        orderString += '],\n';
        orderString += `incorrectScore: 0,\n`;
        orderString += `flexibleCounts: {},\n`;
        orderString += `nonEffectItems: []\n`;
        return orderString;
    };

    const formattedOrderConfig = formatOrderConfig(orderConfig);

    const formattedSummary = `
{
  id: ${summaryData.id},
  character: ${JSON.stringify(summaryData.character, null, 2)},
  dispatchCall: "${summaryData.dispatchCall}",
  diagnosis: "${summaryData.diagnosis}",
  category: "${summaryData.category}",
  initialHealthLevel: ${summaryData.initialHealthLevel},
  maxHealthLevel: ${summaryData.maxHealthLevel},
  initialVitals: {
    BPM: "${summaryData.initialVitals.BPM}",
    Oxygen: "${summaryData.initialVitals.Oxygen}",
    Glucose: "${summaryData.initialVitals.Glucose}",
    BreathingRate: "${summaryData.initialVitals.BreathingRate}",
    BP: "${summaryData.initialVitals.BP}"
  },
  perfectVitals: {
    BPM: "${summaryData.perfectVitals.BPM}",
    Oxygen: "${summaryData.perfectVitals.Oxygen}",
    Glucose: "${summaryData.perfectVitals.Glucose}",
    BreathingRate: "${summaryData.perfectVitals.BreathingRate}",
    BP: "${summaryData.perfectVitals.BP}"
  },
  worseVitals: {
    BPM: "${summaryData.worseVitals.BPM}",
    Oxygen: "${summaryData.worseVitals.Oxygen}",
    Glucose: "${summaryData.worseVitals.Glucose}",
    BreathingRate: "${summaryData.worseVitals.BreathingRate}",
    BP: "${summaryData.worseVitals.BP}"
  },
  applicationInputs: 
\`
${formattedApplicationInputs}
\`,
  orderConfig: 
\`
${formattedOrderConfig}
\`,
itemUsage: ${JSON.stringify(itemUsage, null, 2)},
vitalsCheck: ${JSON.stringify(vitalsCheck, null, 2)},
questions: ${JSON.stringify(questions, null, 2)}
}`;

    return (
        <div className="summary-page">
            <h1>Summary</h1>
            <div className="summary-content">
                <h2>Formatted Summary for Copy/Paste</h2>
                <div className="section-box">
                    <h3>Application Inputs</h3>
                    <pre>{formattedApplicationInputs}</pre>
                </div>
                <div className="section-box">
                    <h3>Order Config</h3>
                    <pre>{formattedOrderConfig}</pre>
                </div>
                <div className="section-box">
                    <h3>Item Usage</h3>
                    <pre>{JSON.stringify(itemUsage, null, 2)}</pre>
                </div>
                <div className="section-box">
                    <h3>Vitals Check</h3>
                    <pre>{JSON.stringify(vitalsCheck, null, 2)}</pre>
                </div>
                <div className="section-box">
                    <h3>Questions</h3>
                    <pre>{JSON.stringify(questions, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage;
