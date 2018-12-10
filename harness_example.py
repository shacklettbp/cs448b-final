import os
os.environ['MANTLE'] = 'coreir'
from magma import *
from magma.circuit import isprimitive
from pico40.asm import *
from pico40.setup import makepico
from magma.simulator.mdb import simulate
from magma.scope import Scope
from magma.simulator.python_simulator import PythonSimulator 
from magma.simulator.coreir_simulator import CoreIRSimulator
from magma.bitutils import seq2int
from collections import defaultdict
import json

def prog():
    ldlo(r0, 3)
    ldlo(r1, 1)
    add(r1,r0)
    add(r1,r1)
    st(r1, 0)
    jmp(2)

class MainCircuit(Circuit):
    name = 'main'
    IO = ['I', In(Bits(8)), 'O', Out(Bits(8)), 'PORTO', Out(Bits(8)), 'CLK', In(Clock)]
    @classmethod
    def definition(circuit):
        pico, romb = makepico(prog, circuit.I, circuit.O, 8, 8, None)
        wire(pico.port, circuit.PORTO)

#simulate(MainCircuit, PythonSimulator)
#simulate(MainCircuit, CoreIRSimulator)
#compile('coreir_proc', MainCircuit, output='coreir')

def get_inst_name(inst):
    return type(inst).__name__ + '.' + inst.name

def create_dict_recurse(circ, cur_scope, values):
    scope_dict = {}
    values[cur_scope.value()] = scope_dict
    scope_dict['_instances'] = []
    scope_dict['_top'] = {}
    scope_dict['_top']['inputs'] = {}
    scope_dict['_top']['outputs'] = {}

    for name, bit in circ.interface.ports.items():
        if bit.isoutput():
            scope_dict['_top']['inputs'][name] = []
        else:
            scope_dict['_top']['outputs'][name] = []

    for inst in circ.instances:
        scope_dict['_instances'].append(get_inst_name(inst))
        scope_dict[get_inst_name(inst)] = {}
        scope_dict[get_inst_name(inst)]['inputs'] = {}
        scope_dict[get_inst_name(inst)]['outputs'] = {}

        for name, bit in inst.interface.ports.items():
            if bit.isinput():
                scope_dict[get_inst_name(inst)]['inputs'][name] = []
            else:
                scope_dict[get_inst_name(inst)]['outputs'][name] = []

        if not isprimitive(inst):
            create_dict_recurse(type(inst), Scope(instance=inst, parent=cur_scope),  values)

def create_dict(circ):
    # Scope => Instance => Wire =>
    values = {}
    create_dict_recurse(circ, Scope(), values)
    return values

def store_value(inst_name, wire_name, value, scope, isinput, cycle, values):
    if not isinstance(value, list):
        value = [value]
    value = seq2int(value)

    inout = 'inputs' if isinput else 'outputs'
    values[scope.value()][inst_name][inout][wire_name].append(value)

def store_values_recurse(circ, simulator, scope, cycle, values):
    for name, bit in circ.interface.ports.items():
        value = simulator.get_value(bit, scope)
        store_value("_top", name, value, scope, not bit.isinput(), cycle, values)

    for inst in circ.instances:
        for name, bit in inst.interface.ports.items():
            value = simulator.get_value(bit, scope)
            store_value(get_inst_name(inst), name, value, scope, bit.isinput(), cycle, values)
        if not isprimitive(inst):
            store_values_recurse(type(inst), simulator, Scope(instance=inst, parent=scope), cycle, values)

def store_values(circ, simulator, cycle, values):
    store_values_recurse(circ, simulator, Scope(), cycle, values)

def process_save_trace(value_store):
    print(value_store)
    #tables = pd.DataFrame(value_store)
    #print(tables)
    #tables.to_csv("trace.csv")
    with open("trace.json", "w") as f:
        json.dump(value_store, f)

def store_trace(circ, num_cycles):
    simulator = PythonSimulator(circ, circ.CLK)
    print(circ.interface.ports.items())
    value_store = create_dict(circ)
    for i in range(num_cycles):
        store_values(circ, simulator, i, value_store)
        simulator.advance(1)

    process_save_trace(value_store)

store_trace(MainCircuit, 600)
