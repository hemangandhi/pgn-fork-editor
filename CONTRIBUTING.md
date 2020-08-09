# You Really Wrote This?!

I'm not narcissistic enough to expect that I'm not the only reader of this (hi future me!).
I'm really writing this for my future self, but with the added bonus that others can read
it instead.

## What This is

This is a PGN editor. The expectation is that it lives for people to annotate games and
move on. When they move on, they are expected to save annotations by copy-pasting them out
or by making a URL to the page (where the URL just serializes their annotations).

I don't expect to have a notion of users, backends, or anything else. Just an editor.

## What I Want for the Code

- It to run without a backend.
- If anything has to be compiled, that will happen automatically with CI/CD.

## What I Believe to Get What I Want

(Because the code sucks and these are my excuses.)

- React (or anything else needing NPM, Webpack, or that fancy JS framework made yesterday)
  is overkill: at most jQuery is needed for a reasonable experience.
- There's no use-case for a backend. (Even for better sharing and group-editing: I don't
  think either use-case is worth it, and neither are goals.)

## Pitfalls

(AKA the truth (or more accurate excuses) behind the excuses.)

I don't know enough JS to be certain about which features are supported by what versions,
browsers, and Satanists. Hence, I wrote this code as if it's 2012 and I'm a n00b on
Codecademy or Khan Academy. If you take issue to this, please let me know through an issue
and I will try to fix it. The onus of enlightening me, however, is on you, because I'm lazy
and I expect that the code mostly works. (And, honestly, will not be touched by another
human until some unfortunate soul digs it up in the Arctic.)

