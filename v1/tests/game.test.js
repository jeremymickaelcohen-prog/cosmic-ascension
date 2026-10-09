import test from "node:test";
import assert from "node:assert/strict";
import {Game as G} from "../src/engine.js";

test("15 ages, 75 technologies, multiple buildings",()=>{assert.equal(G.AGES.length,15);assert.equal(G.TECHS.length,75);assert.ok(G.BUILDINGS.length>=45);});
test("manual gathering is immutable",()=>{const s=G.newGame(),n=G.harvest(s,"energy");assert.equal(n.resources.energy,1);assert.equal(s.resources.energy,0);});
test("buying then idle simulation produces energy",()=>{let s={...G.newGame(),dev:true};s=G.grant(s,"energy",1000);const b=G.buy(s,"power-0",3);assert.equal(b.count,3);assert.ok(G.simulate(b.state,20).resources.energy>b.state.resources.energy);});
test("research spends science and prevents duplicates",()=>{const s=G.grant({...G.newGame(),dev:true},"science",1000);const n=G.research(s,"energy-0");assert.equal(n.researched.length,1);assert.equal(G.research(n,"energy-0"),n);});
test("ascension resets transient progress",()=>{const s=G.complete({...G.newGame(),dev:true});assert.equal(G.requirements(s).ready,true);const a=G.ascend(s);assert.equal(a.age,1);assert.equal(a.resources.energy,0);assert.equal(a.researched.length,0);assert.equal(Object.keys(a.buildings).length,0);assert.ok(a.knowledge>0);assert.equal(G.validate(a),true);});
test("galactic final objective can be reached",()=>{const s=G.complete(G.jump({...G.newGame(),dev:true},14));assert.equal(G.requirements(s).ready,true);assert.equal(G.ascend(s).won,true);});
test("resource shortage never goes negative",()=>{let s=G.jump({...G.newGame(),dev:true},5);s=G.grant(s,"energy",1e9);s=G.grant(s,"wood",1e9);s=G.grant(s,"stone",1e9);s=G.buy(s,"matter-5",1).state;const n=G.simulate(s,100);assert.equal(n.resources.steel,0);assert.ok(n.resources.iron>=0);});
