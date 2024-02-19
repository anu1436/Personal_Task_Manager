import sqlite3
from flask import Flask, render_template, request, redirect, url_for, g, jsonify

DATABASE = 'tasks.db'

app = Flask(__name__)

def init_db(app):
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # This allows us to have dict-like access to columns
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


@app.route('/')
def index():
    tasks = query_db('SELECT * FROM tasks')
    print(tasks)
    return render_template('index.html', tasks=tasks)


@app.route('/add_task', methods=['POST'])
def add_task():
    # Retrieve form data from request.form and insert it into the database
    title = request.form['title']
    description = request.form.get('description', '')
    due_date = request.form.get('due_date')
    priority = int(request.form.get('priority', 0))
    completion_status = 0  # Assuming a new task is not completed

    # Establish a database connection and create a cursor
    db = get_db()
    cursor = db.cursor()

    try:
        # Insert the new task into the tasks table
        cursor.execute('INSERT INTO tasks (title, description, due_date, priority, completion_status) VALUES (?, ?, ?, ?, ?)', 
                       (title, description, due_date, priority, completion_status))
        
        # Commit the changes
        db.commit()
    except sqlite3.IntegrityError as e:
        # Rollback the changes on error
        db.rollback()
        return jsonify({"success": False, "message": "Database error: " + str(e)}), 500
    finally:
        # Close the cursor
        cursor.close()

    # Return a success message
    return jsonify({"success": True, "message": "Task added successfully"})

# ... [rest of your current code] ...

@app.route('/edit_task/<int:task_id>', methods=['POST'])
def edit_task(task_id):
    title = request.form['title']
    description = request.form.get('description', '')
    due_date = request.form.get('due_date')
    priority = int(request.form.get('priority', 0))

    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            'UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ? WHERE id = ?', 
            (title, description, due_date, priority, task_id)
        )
        db.commit()
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
    
    return jsonify({"success": True, "message": "Task updated successfully"})

@app.route('/delete_task/<int:task_id>', methods=['POST'])
def delete_task(task_id):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        db.commit()
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
    
    return jsonify({"success": True, "message": "Task deleted successfully"})

@app.route('/mark_task/<int:task_id>/<int:status>', methods=['POST'])
def mark_task_as_done(task_id, status):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            'UPDATE tasks SET completion_status = ? WHERE id = ?', 
            (status, task_id)
        )
        db.commit()
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()

    return jsonify({"success": True, "message": "Task completion status updated successfully"})

@app.route('/get_tasks')
def get_tasks():
    tasks = query_db('SELECT * FROM tasks')
    return jsonify(tasks)

# ... [rest of your current code] ...
def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return [dict(ix) for ix in rv] if rv else None if one else rv


if __name__ == "__main__":
    init_db(app)  # Initialize the database
    app.run(debug=True)
