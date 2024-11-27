import React from "react";
import FlowChart from "./components/FlowChart";
import "./App.css";

function App() {
  return (
    <div className="h-dvh w-dvw bg-gradient-to-r from-blue-100 via-indigo-200 to-purple-300 text-[#153448]  ">
      <div className="w-[350px] md:w-[650px] h-[600px] mx-auto">
      <h1 className="text-2xl md:text-4xl text-center font-bold text-[#2C3E50] mb-6">
          Email Marketing Sequence
        </h1>
        <FlowChart />
      </div>
    </div>
  );
}

export default App;
