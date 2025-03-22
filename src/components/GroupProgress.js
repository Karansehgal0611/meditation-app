import React from 'react';

const GroupProgress = ({ groupData, currentUserId }) => {
  // Sort group data by today's meditation count (descending)
  const sortedData = [...groupData].sort((a, b) => b.todayCount - a.todayCount);

  return (
    <div className="group-progress">
      <table className="group-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Today's Sessions</th>
            <th>Total Minutes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(user => (
            <tr 
              key={user.id} 
              className={user.id === currentUserId ? 'current-user' : ''}
            >
              <td className="user-cell">
                <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
                <span>{user.name}</span>
              </td>
              <td>{user.todayCount}</td>
              <td>{user.totalMinutes}</td>
              <td>
                <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Meditating now' : 'Not meditating'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GroupProgress; 