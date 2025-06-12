"use client";

import React, { useState, useEffect } from 'react';
import Task from './Task';

export interface TodoTask {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoProps {
  title?: string;
}

export default function Todo({ title = "Lista de Tarefas" }: TodoProps) {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      try {
        setTasks(JSON.parse(storedTasks));
      } catch (e) {
        console.error('Erro ao carregar tarefas:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (text.trim()) {
      const newTask: TodoTask = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setText('');
    }
  };

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">{title}</h1>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="Adicionar nova tarefa..."
          className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none"
        >
          Adicionar
        </button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma tarefa adicionada</p>
        ) : (
          tasks.map((task) => (
            <Task
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          {tasks.filter(t => t.completed).length} de {tasks.length} tarefas concluídas
        </div>
      )}
    </div>
  );
} 