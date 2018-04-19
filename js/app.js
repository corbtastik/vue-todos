/*global Vue */

(function (exports) {

	'use strict';

	Vue.use(VueResource);
	// TODO is there a better way to get this value?
	var endpoint = '/api'
	var filters = {
		all: function (todos) {
			return todos;
		},
		active: function (todos) {
			return todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		completed: function (todos) {
			return todos.filter(function (todo) {
				return todo.completed;
			});
		}
	};

	exports.app = new Vue({

		// the root element that will be compiled
		el: '.todoapp',

		// app initial state
		data: {
			todos: [],
			newTodo: '',
			editedTodo: null,
			visibility: 'all'
		},

		// watch todos change and save via API
		watch: {
			todos: {
				deep: true,
				handler: function(values) {
					let self = this;
					values.forEach(todo => {
						if(todo.id) {
							Vue.http.patch(endpoint + '/' + todo.id,todo);
						}
					});
					
				}
			}
		},

		// computed properties
		// http://vuejs.org/guide/computed.html
		computed: {
			filteredTodos: function () {
				return filters[this.visibility](this.todos);
			},
			remaining: function () {
				return filters.active(this.todos).length;
			},
			allDone: {
				get: function () {
					return this.remaining === 0;
				},
				set: function (value) {
					this.todos.forEach(function (todo) {
						todo.completed = value;
					});
				}
			}
		},

		// methods that implement data logic.
		// note there's no DOM manipulation here at all.
		methods: {

			pluralize: function (word, count) {
				return word + (count === 1 ? '' : 's');
			},

			addTodo: function () {
				var value = this.newTodo && this.newTodo.trim();
				if (!value) {
					return;
				}
				this.createTodo({
					title: value,
					completed: false
				});
				this.newTodo = '';
			},

			createTodo: function(todo) {
				let result = {};
				let self = this;
				Vue.http.post(endpoint, {
					title: todo.title,
					completed: todo.completed
				}).then(response => {
					self.todos.push(response.body);
				});				
			},

			removeTodo: function (todo) {
				Vue.http.delete(endpoint + '/' + todo.id).then(response => {
					var index = this.todos.indexOf(todo);
					this.todos.splice(index, 1);
				});
			},

			editTodo: function (todo) {
				this.beforeEditCache = todo.title;
				this.editedTodo = todo;
			},

			doneEdit: function (todo) {
				if (!this.editedTodo) {
					return;
				}
				this.editedTodo = null;
				todo.title = todo.title.trim();
				if (!todo.title) {
					this.removeTodo(todo);
				}
			},

			cancelEdit: function (todo) {
				this.editedTodo = null;
				todo.title = this.beforeEditCache;
			},

			removeCompleted: function () {
				this.todos = filters.active(this.todos);
			}
		},

		beforeMount() {
			let self = this;
			Vue.http.get(endpoint).then(response => {
				let list = JSON.parse(response.bodyText);
				list.forEach(item => {
					self.todos.push(item);	
				});
			});
		},

		// a custom directive to wait for the DOM to be updated
		// before focusing on the input field.
		// http://vuejs.org/guide/custom-directive.html
		directives: {
			'todo-focus': function (el, binding) {
				if (binding.value) {
					el.focus();
				}
			}
		}
	});

})(window);
