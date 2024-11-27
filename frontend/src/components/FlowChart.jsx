import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges } from "reactflow";
import axios from "axios";
import Modal from "react-modal";
import "reactflow/dist/style.css";
import { useState, useCallback, useEffect } from "react";

// Set the root element for the modal
Modal.setAppElement("#root");

// Custom styles for the modal
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "500px",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  },
};

const FlowChart = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeCount, setNodeCount] = useState(1);
  const [selectedNodeType, setSelectedNodeType] = useState("Lead-Source");
  const [modalIsOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [editingNode, setEditingNode] = useState(null);

  // Callback to handle node changes
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Callback to handle edge changes
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Function to add a new node and connect it to previous node
  const addNode = (label, content) => {
    const newNodeId = (nodeCount + 1).toString();
    const newNode = {
      id: newNodeId,
      data: { label: `${label}\n${content}` },
      position: { x: 100, y: nodeCount * 100 },
    };
    setNodes((nds) => nds.concat(newNode));
    setNodeCount((count) => count + 1);

    const newEdge = {
      id: `${nodeCount}-${newNodeId}`,
      source: `${nodeCount}`,
      target: newNodeId,
    };
    setEdges((eds) => eds.concat(newEdge));
  };

  // Handle the addition of a new node
  const handleAddNode = () => {
    if (selectedNodeType) {
      setModalContent(selectedNodeType);
      setIsOpen(true);
      setEditingNode(null);
    } else {
      alert("Please select a valid node type.");
    }
  };

  // Handle form submission for adding/updating nodes
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const subject = formData.get("subject");
    const text = formData.get("content");
    const delay = formData.get("delay");
    const email = formData.get("email");
    let nodeContent = "";

    if (modalContent === "Cold-Email") {
      nodeContent = `- (${subject}) ${text}`;
    } else if (modalContent === "Wait/Delay") {
      nodeContent = `- (${delay})`;
    } else {
      nodeContent = `- (${email})`;
    }

    // Update the existing node if editing, otherwise add a new node
    if (editingNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingNode.id
            ? { ...node, data: { label: `${modalContent}\n${nodeContent}` } }
            : node
        )
      );
    } else {
      if (selectedNodeType === "Lead-Source") {
        setSelectedNodeType("Cold-Email");
      }
      addNode(modalContent, nodeContent);
    }
    setIsOpen(false);
  };

  // Render the modal content based on the selected node type
  const renderModalContent = () => {
    switch (modalContent) {
      case "Cold-Email":
        return (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="subject" className="text-sm font-semibold">Subject:</label>
            <input
              type="text"
              name="subject"
              id="subject"
              defaultValue={editingNode?.data.label.split("- (")[1]?.split(")")[0] || ""}
              required
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="content" className="text-sm font-semibold">Content:</label>
            <input
              type="text"
              name="content"
              id="content"
              defaultValue={editingNode?.data.label.split(") ")[1] || ""}
              required
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200">
              {editingNode ? "Update Cold Email" : "Add Cold Email"}
            </button>
          </form>
        );
      case "Wait/Delay":
        return (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="delay" className="text-sm font-semibold">Delay:</label>
            <select
              name="delay"
              id="delay"
              defaultValue={editingNode?.data.label.split("- (")[1]?.split(" min")[0] + " min" || ""}
              required
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(6).keys()].map((i) => (
                <option key={i} value={`${i + 1} min`}>
                  {i + 1} min
                </option>
              ))}
            </select>
            <button type="submit" className="mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200">
              {editingNode ? "Update Delay" : "Add Delay"}
            </button>
          </form>
        );
      case "Lead-Source":
        return (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="email" className="text-sm font-semibold">Recipient Email:</label>
            <input
              name="email"
              id="email"
              defaultValue={editingNode?.data.label.split("- (")[1]?.split(")")[0] || ""}
              required
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200">
              {editingNode ? "Update Lead Source" : "Add Lead Source"}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  // Handle node click to open modal for editing
  const handleNodeClick = (event, node) => {
    setModalContent(node.data.label.split("\n")[0]);
    setIsOpen(true);
    setEditingNode(node);
  };

  // Handle the process start
  const handleStartProcess = async () => {
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/sequence/start-process`,
      {
        nodes,
        edges,
      }
    );
    if (response.status === 200) {
      alert("Process started successfully");
    } else {
      alert("Error starting process");
    }
  };

  // Add the initial lead-source node on component mount
  useEffect(() => {
    handleAddNode();
  }, []);

  return (
    <div className="w-full h-full mt-4">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        className="rounded-md bg-[#3C5B6F] shadow-lg"
      >
        <Controls />
        <Background />
      </ReactFlow>
      <div className="w-full flex items-center justify-center gap-4 mt-4">
        <select
          value={selectedNodeType}
          onChange={(e) => setSelectedNodeType(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Cold-Email">Cold Email</option>
          <option value="Wait/Delay">Wait/Delay</option>
        </select>
        <button
          onClick={handleAddNode}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Add Node
        </button>
        <button
          onClick={handleStartProcess}
          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
        >
          Start Process
        </button>
      </div>

      {/* Modal for adding/editing nodes */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setIsOpen(false)}
        style={customStyles}
        contentLabel="Node Modal"
      >
        <h2 className="text-xl font-semibold text-center mb-4">{modalContent}</h2>
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default FlowChart;
