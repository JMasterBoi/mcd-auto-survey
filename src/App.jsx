import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { SpeedInsights } from "@vercel/speed-insights/react"

function App() {
  const [inputCode, setInputCode] = useState('')
  const [queue, setQueue] = useState([])
  const [finishedTasks, setFinishedTasks] = useState([])
  const [inputError, setInputError] = useState('')
  const isProcessingRef = useRef(false);

  // Validate McDonald's code format: #####-#####-#####-#####-#####-#
  const validateCode = (code) => {
    const pattern = /^\d{5}-\d{5}-\d{5}-\d{5}-\d{5}-\d$/
    return pattern.test(code)
  }

  // Format input as user types
  const formatInput = (value) => {
    const numbers = value.replace(/\D/g, '')
    const formatted = numbers.replace(/(\d{5})(?=\d)/g, '$1-')
    return formatted.substring(0, 31) // Max length for the format
  }

  const handleInputChange = (e) => {
    const formatted = formatInput(e.target.value)
    setInputCode(formatted)
    setInputError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!inputCode.trim()) {
      setInputError('Please enter a code')
      return
    }

    if (!validateCode(inputCode)) {
      setInputError('Invalid code format. Use: #####-#####-#####-#####-#####-#')
      return
    }

    // Check if code already exists
    if (queue.some(item => item.code === inputCode)) {
      setInputError('Code already in queue')
      return
    }

    // Add to queue
    const newItem = {
      id: crypto.randomUUID(),
      code: inputCode,
      status: 'pending', // pending, processing, completed, error
      progress: 0
    }

    setQueue(prev => [...prev, newItem])
    setInputCode('')
    setInputError('')

    // Simulate processing
    // simulateProgress(newItem.id)
  }


  //!
  // Simulate long-running task
  const runTask = async (taskId) => {
    for (let i = 1; i <= 10; i++) {
      await new Promise(res => setTimeout(res, 400)); // simulate work
      setQueue(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, progress: i * 10 } : t
        )
      );
    }
  };


  // Process the queue (runs one at a time)
  const processQueue = async () => {
    console.log("isProcessingRef.current", isProcessingRef.current)

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    while (true) {
      const task = queue.find(t => t.status === 'pending');
      console.log("task", task)
      if (!task) {console.log("break");break};
      
      // Mark as processing
      setQueue(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, status: 'processing' } : t
        )
      );
      console.log("run task")
      await runTask(task.id);
      console.log("end run task")
      
      // Mark as completed
      setQueue(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t
        )
      );
    }
    
    isProcessingRef.current = false;
  };

  // Watch for new tasks
  useEffect(() => {
    if (queue.some(t => t.status === 'pending')) {
      console.log("found a pending task in queue")
      checkQueue();
    }
  }, [queue]);

  // check if there is something pending in queue
  async function checkQueue() {
    console.log("isProcessingRef.current", isProcessingRef.current)
    if (isProcessingRef.current) {console.log("im busy rn bro"); return}
    
    const pendingTasks = queue.filter(t => t.status === 'pending')
    console.log("pendingTasks", pendingTasks)
    if (pendingTasks.length != 0) {
      isProcessingRef.current = true;
      console.log("confirmed there is a pending task")

      await startTask(pendingTasks[0].id);
  
      checkQueue()
    } else {
      console.log("there were 0 pending tasks")
    }
  }

  async function startTask(currentTaskId) {
    // set the task to processing
    setQueue(prev =>
      prev.map(t =>
        t.id === currentTaskId ? { ...t, status: 'processing' } : t
      )
    );

    const code = queue.filter(survey => survey.id === currentTaskId)[0]?.code
    
    //! start the survey
    console.log("start the survey")
    // axios.post("http://localhost:3000/api/start-survey", {code: code})
    axios.post("/api/start-survey", {code: code})

    // poll for the progress
    const interval = setInterval(async () => {
      //! get code from 
      console.log("getting progress");
      const response = await axios.get(`/api/progress?code=${code}`) ?? 0;
      // const response = await axios.get(`http://localhost:3000/api/progress?code=${code}`);
      const progress = response?.data.progress ?? 0
      console.log("progress: ", progress);

      if (progress == "100") {
        console.log("progress has reached 100%")
        
        let finishedSurvey = queue.filter((task) => task.id === currentTaskId)[0];
        finishedSurvey.status = "completed";
        finishedSurvey.progress = 100;
        // const valCodeResponse = await axios.get(`http://localhost:3000/api/val-code?code=${code}`, {code: code})
        const valCodeResponse = await axios.get(`/api/val-code?code=${code}`, {code: code})
        console.log("valCode:", valCodeResponse.data.valCode)
        finishedSurvey.valCode = valCodeResponse.data.valCode??"N/A";
        setFinishedTasks(prev => [...prev, finishedSurvey])
        setQueue(prev => prev.filter((task) => task.id != currentTaskId))
        clearInterval(interval)
        isProcessingRef.current = false;
      }
      else if (progress == "error") {
        console.log("progress has failed")
        let finishedSurvey = queue.filter((task) => task.id === currentTaskId)[0];
        finishedSurvey.status = "error";
        finishedSurvey.progress = 100;
        finishedSurvey.valCode = "N/A";
        setFinishedTasks(prev => [...prev, finishedSurvey])
        setQueue(prev => prev.filter((task) => task.id != currentTaskId))
        clearInterval(interval)
        isProcessingRef.current = false;
      } else {
        setQueue((prev) => {
          return prev.map(i => 
            i.id === currentTaskId ? { ...i, progress: progress } : i
          )
        })
      }

    }, 1500)
  }
  //!

  const removeFromQueue = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  const clearCompleted = () => {
    setQueue(prev => prev.filter(item => item.status !== 'completed'))
  }

  const getProgressColor = (status, progress) => {
    switch (status) {
      case 'completed': return 'var(--success-color)'
      case 'error': return 'var(--error-color)'
      case 'processing': return progress > 50 ? 'var(--warning-color)' : 'var(--primary-color)'
      default: return 'var(--secondary-color)'
    }
  }

  const getStatusText = (status, progress) => {
    switch (status) {
      case 'pending': return 'Waiting...'
      case 'processing': return `Processing... ${Math.round(progress)}%`
      case 'completed': return 'Completed'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>McDonald's Survey Automation</h1>
          <p>Enter your survey codes to automatically complete surveys</p>
        </header>

        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <input
              autoFocus
              type="text"
              value={inputCode}
              onChange={handleInputChange}
              placeholder="Enter code: #####-#####-#####-#####-#####-#"
              className={`code-input ${inputError ? 'error' : ''}`}
            />
            <button type="submit" className="add-button">
              Add to Queue
            </button>
          </div>
          {inputError && <div className="error-message">{inputError}</div>}
        </form>

        <div className="queue-header">
          <h2>Queue ({queue.length})</h2>
          {queue.some(item => item.status === 'completed') && (
            <button onClick={clearCompleted} className="clear-button">
              Clear Completed
            </button>
          )}
        </div>

        <div className="queue-list">
          {queue.length === 0 ? (
            <div className="empty-state">
              <p>No codes in queue. Add a code above to get started.</p>
            </div>
          ) : (
            queue.map((item) => (
              <div key={item.id} className={`queue-item ${item.status}`}>
                <div className="item-header">
                  <span className="code">{item.code}</span>
                  <button 
                    onClick={() => removeFromQueue(item.id)}
                    className="remove-button"
                    title="Remove from queue"
                  >
                    ×
                  </button>
                </div>
                
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${item.progress}%`,
                        backgroundColor: getProgressColor(item.status, item.progress)
                      }}
                    ></div>
                  </div>
                  <span className="status-text">
                    {getStatusText(item.status, item.progress)}
                  </span>
                </div>
              </div>
            ))
          )}

          {finishedTasks.length === 0 || (
            <>
              <br />
              <hr />
              <br />
              <div className="queue-header">
                <h2>Finished Surveys ({finishedTasks.length})</h2>
              </div>
            </>
            )}

          {finishedTasks.map((item) => (
            <div key={item.id} className={`queue-item ${item.status}`}>
              <div className="item-header">
                <span className="code">{item.code}</span>
                <span className="code">Validation Code: {item.valCode}</span>
              </div>
              
              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${item.progress}%`,
                      backgroundColor: getProgressColor(item.status, item.progress)
                    }}
                  ></div>
                </div>
                <span className="status-text">
                  {getStatusText(item.status, item.progress)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <footer className="footer">
          <p>Tip: You can quickly add multiple codes by pressing Enter after each one</p>
        </footer>
      </div>
      <SpeedInsights />
    </div>
  )
}

export default App