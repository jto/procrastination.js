# procratination.js

## What is it?

procratination.js makes it easy to create realtime web applications using pure Javascript,
by replacing the old callback paradigm, by a stream of events called a Reactive.
You're not working on discrete events anymore, but with a continuous, possibly infinite, list of incoming data of any kind.
Reactives have the traditionnal list methods that you are used to, like filter and map, are immutable, and reusable.

## Reactive

### Creating a Reactive

Let's say you want to react on keyboard events. What you first need to do, is to create a function that is your Events source:

<code>
	function key(next){ $(document.body).keydown(next) }
</code>

<code>next</code> is a the function that should be called when an new event is raised.

Then you need to create a new Reactive, 
<code>
	Reactive.on(key)
</code>

A Reactive won't do anything until call 'subscribe' on it.

<code>
	Reactive.on(key)
		.subscribe()
</code>

We now have created our very first reactive :)
This one does not do anything, we'll now take a look at Actions.

## Action

Let's start with our first reactive:
<code>
	Reactive.on(key)
		.subscribe()
</code>


