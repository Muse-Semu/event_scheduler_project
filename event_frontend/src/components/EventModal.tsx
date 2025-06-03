import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useModalStore } from '../store/modalStore';

const EventModal: React.FC = () => {
  const { isOpen, selectedEvent, closeModal } = useModalStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: selectedEvent?.title || '',
    description: selectedEvent?.description || '',
    location: selectedEvent?.location || '',
    start_time: selectedEvent?.start_time
      ? new Date(selectedEvent.start_time).toISOString().slice(0, 16)
      : '',
    end_time: selectedEvent?.end_time
      ? new Date(selectedEvent.end_time).toISOString().slice(0, 16)
      : '',
    is_recurring: selectedEvent?.is_recurring || false,
    recurrence_rule: {
      frequency: selectedEvent?.recurrence_rule?.frequency || 'DAILY',
      interval: selectedEvent?.recurrence_rule?.interval || 1,
      end_date: selectedEvent?.recurrence_rule?.end_date || '',
    },
  });

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const url = selectedEvent
        ? `http://localhost:8000/api/events/${selectedEvent.id}/`
        : 'http://localhost:8000/api/events/';
      const method = selectedEvent ? 'put' : 'post';
      return axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          'An error occurred.',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data = {
      ...formData,
      recurrence_rule: formData.is_recurring ? formData.recurrence_rule : null,
    };
    mutation.mutate(data);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('recurrence_rule.')) {
      const key = name.split('.')[1];
      setFormData({
        ...formData,
        recurrence_rule: { ...formData.recurrence_rule, [key]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, is_recurring: e.target.checked });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">
          {selectedEvent ? 'Edit Event' : 'New Event'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Start Time</label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Time</label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={handleCheckbox}
                className="mr-2"
              />
              Recurring Event
            </label>
          </div>
          {formData.is_recurring && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium">Frequency</label>
                <select
                  name="recurrence_rule.frequency"
                  value={formData.recurrence_rule.frequency}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Interval</label>
                <input
                  type="number"
                  name="recurrence_rule.interval"
                  value={formData.recurrence_rule.interval}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  min="1"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">End Date</label>
                <input
                  type="date"
                  name="recurrence_rule.end_date"
                  value={formData.recurrence_rule.end_date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
