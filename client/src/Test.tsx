import React from 'react';

export default function Test() {
  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Test Page Works!</h1>
        <p className="text-gray-600 mb-4">If you can see this, React is rendering correctly.</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => alert('Button clicked!')}
        >
          Click Me
        </button>
      </div>
    </div>
  );
}