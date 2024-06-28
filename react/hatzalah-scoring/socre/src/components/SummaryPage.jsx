import React from 'react';

const SummaryPage = () => {
    const summaryData = JSON.parse(localStorage.getItem('summaryData')) || {};
    const questions = JSON.parse(localStorage.getItem('questions')) || {};
    const itemUsage = JSON.parse(localStorage.getItem('itemUsage')) || {};
    const applicationInputs = JSON.parse(localStorage.getItem('applicationInputs')) || {};
    const orderConfig = JSON.parse(localStorage.getItem('orderConfig')) || [];
    const vitalsCheck = JSON.parse(localStorage.getItem('vitalsCheck')) || {};

    const filteredApplicationInputs = Object.fromEntries(
        Object.entries(applicationInputs).filter(([key, values]) => values.length > 1 || values.some(value => value !== 0))
    );

    const formatApplicationInputs = (inputs) => {
        let itemString = `case ${summaryData.id}: // ${summaryData.dispatchCall}\n`;
        Object.entries(inputs).forEach(([itemName, values]) => {
            itemString += `if (itemName === "${itemName}") {\n`;

            values.forEach((value, idx) => {
                itemString += `  if (itemClickCount[itemName] === ${idx + 1}) adjustment = ${value};\n`;
            });

            itemString += `}\n`;
        });
        return itemString.trim(); // Remove trailing whitespace
    };

    const formattedApplicationInputs = formatApplicationInputs(filteredApplicationInputs);

    const formatOrderConfig = (orderConfig) => {
        let orderString = `case ${summaryData.id}: // ${summaryData.dispatchCall}\npossibleOrders: [\n`;
        if (Array.isArray(orderConfig.possibleOrders)) {
            orderConfig.possibleOrders.forEach(order => {
                orderString += `  { order: [${order.items.map(item => `"${item}"`).join(', ')}], score: ${order.score} },\n`;
            });
        }
        orderString += '],\n';
        orderString += `correctItems: [${orderConfig.correctItems ? orderConfig.correctItems.map(item => `"${item}"`).join(', ') : ''}],\n`;
        orderString += `affectItems: [${orderConfig.affectItems ? orderConfig.affectItems.map(item => `"${item}"`).join(', ') : ''}],\n`;
        return orderString.trim(); // Remove trailing whitespace
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
    BPM: "${summaryData.initialVitals?.BPM || ''}",
    Oxygen: "${summaryData.initialVitals?.Oxygen || ''}",
    Glucose: "${summaryData.initialVitals?.Glucose || ''}",
    BreathingRate: "${summaryData.initialVitals?.BreathingRate || ''}",
    BP: "${summaryData.initialVitals?.BP || ''}"
  },
  perfectVitals: {
    BPM: "${summaryData.perfectVitals?.BPM || ''}",
    Oxygen: "${summaryData.perfectVitals?.Oxygen || ''}",
    Glucose: "${summaryData.perfectVitals?.Glucose || ''}",
    BreathingRate: "${summaryData.perfectVitals?.BreathingRate || ''}",
    BP: "${summaryData.perfectVitals?.BP || ''}"
  },
  worseVitals: {
    BPM: "${summaryData.worseVitals?.BPM || ''}",
    Oxygen: "${summaryData.worseVitals?.Oxygen || ''}",
    Glucose: "${summaryData.worseVitals?.Glucose || ''}",
    BreathingRate: "${summaryData.worseVitals?.BreathingRate || ''}",
    BP: "${summaryData.worseVitals?.BP || ''}"
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
questions: ${JSON.stringify(questions, null, 2)},
}`;

    return (
        <div className="summary-page">
            <h1>Summary</h1>
            <div className="summary-content">
                <div className="case-number">Case Number: {summaryData.id}</div>
                {formattedApplicationInputs && (
                    <div className="section-box">
                        <h3>Application Inputs</h3>
                        <pre>{formattedApplicationInputs}</pre>
                    </div>
                )}
                {formattedOrderConfig && (
                    <div className="section-box">
                        <h3>Order Config</h3>
                        <pre>{formattedOrderConfig}</pre>
                    </div>
                )}
                {Object.keys(itemUsage).length > 0 && (
                    <div className="section-box">
                        <h3>Item Usage</h3>
                        <pre>{JSON.stringify(itemUsage, null, 2)}</pre>
                    </div>
                )}
                {Object.keys(vitalsCheck).length > 0 && (
                    <div className="section-box">
                        <h3>Vitals Check</h3>
                        <pre>{JSON.stringify(vitalsCheck, null, 2)}</pre>
                    </div>
                )}
                {Object.keys(questions).length > 0 && (
                    <div className="section-box">
                        <h3>Questions</h3>
                        <pre>{JSON.stringify(questions, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SummaryPage;
