from random import shuffle, randint
import tensorflow as tf

num_chords = 8
num_possible_notes = 12

num_samples = 100

valid_chords = [
    [ 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0 ],
    [ 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ],
    [ 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0 ],
    [ 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0 ],
    [ 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1,],
    [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0 ],
    [ 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0 ],
    [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1 ],
    [ 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0 ],
    [ 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0 ],
    [ 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0 ],
    [ 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1 ],
]

def flatten(arrays):
    return reduce(lambda x, y: x+y, arrays)

expanded_valid_chords = []
for i in range(8):
    expanded_valid_chords = expanded_valid_chords + valid_chords

progressions = []
progression_labels = []

def generateProgression(expanded_valid_chords):
    shuffle(expanded_valid_chords)
    return flatten(expanded_valid_chords[0:8])

def generateInvalidProgression():
    tmp = [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]*8
    shuffle(tmp)
    return tmp

num_samples = 20000

for i in range(num_samples/2):
    progressions.append(generateProgression(expanded_valid_chords))
    progression_labels.append([1])
    progressions.append(generateInvalidProgression())
    progression_labels.append([0])

# progressions.append(dumb_real_progression)
# progression_labels.append([1])
# progressions.append(dumb_fake_progression)
# progression_labels.append([1])

n_nodes_hidden_layer1 = 10
n_nodes_hidden_layer2 = 5
n_nodes_hidden_layer3 = 5

def neural_network_model(data):
    hidden_layer1 = {
        'weights': tf.Variable(tf.random_normal([num_chords * num_possible_notes, n_nodes_hidden_layer1])),
        'biases': tf.Variable(tf.random_normal([n_nodes_hidden_layer1]))
    }
    hidden_layer2 = {
        'weights': tf.Variable(tf.random_normal([n_nodes_hidden_layer1, n_nodes_hidden_layer2])),
        'biases': tf.Variable(tf.random_normal([n_nodes_hidden_layer2]))
    }
    hidden_layer3 = {
        'weights': tf.Variable(tf.random_normal([n_nodes_hidden_layer2, n_nodes_hidden_layer3])),
        'biases': tf.Variable(tf.random_normal([n_nodes_hidden_layer3]))
    }
    output_layer = {
        'weights': tf.Variable(tf.random_normal([n_nodes_hidden_layer3, 1])),
        'biases': tf.Variable(tf.random_normal([1]))
    }

    # Matmul doesn't support vector by matrix multiplication
    matricized_data = tf.expand_dims(data, 1)
    l1 = tf.add(tf.matmul(matricized_data, hidden_layer1['weights'], transpose_a=True), hidden_layer1['biases'])
    # Apply an activation function
    l1 = tf.nn.relu(l1)

    l2 = tf.add(tf.matmul(l1, hidden_layer2['weights']), hidden_layer2['biases'])
    l2 = tf.nn.relu(l2)

    l3 = tf.add(tf.matmul(l2, hidden_layer3['weights']), hidden_layer3['biases'])
    l3 = tf.nn.relu(l3)

    output = tf.add(tf.matmul(l3, output_layer['weights']), output_layer['biases'])
    #
    output = tf.sigmoid(output)

    return output

def train_neural_network(progressions, progression_labels):
    progression_placeholder = tf.placeholder(tf.float32,[num_chords * num_possible_notes])
    progression_label_placeholder = tf.placeholder(tf.float32)

    num_samples = len(progressions)

    progression_label_prediction_tensor = neural_network_model(progression_placeholder)
    # cost = tf.reduce_sum(tf.pow(progression_label_placeholder - progression_label_prediction_tensor, 2))
    cost = tf.nn.l2_loss(progression_label_placeholder - progression_label_prediction_tensor)
    # cost = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=progression_label_prediction_tensor, labels=progression_label_placeholder))
    optimizer = tf.train.AdamOptimizer().minimize(cost)

    num_epochs = 8

    with tf.Session() as sess:
        sess.run(tf.global_variables_initializer())

        for epoch in range(num_epochs):
            epoch_cost_loss = 0
            i = 0
            while i < num_samples:
                progression = progressions[i]
                progression_label = progression_labels[i]
                # This isn't working for some reason, to do with my architecture being wrong or the cost bits being setup wrong?
                _optimizer, cost_loss = sess.run([optimizer, cost], feed_dict={ progression_placeholder: progression, progression_label_placeholder: progression_label })
                # print(_optimizer, cost_loss)
                epoch_cost_loss += cost_loss
                i += 1
            print('Epoch', epoch, 'completed out of', num_epochs, 'with avg loss', epoch_cost_loss/num_samples)

        print(progression_label_prediction_tensor.eval({ progression_placeholder: generateProgression(expanded_valid_chords) }))
        fake = generateInvalidProgression()
        print(fake)
        print(progression_label_prediction_tensor.eval({ progression_placeholder: fake }))

        # This continues in the same session, comparing the predictions
        # correct_tensor = tf.equal(progression_label_placeholder, progression_label_prediction_tensor)
        # accuracy_tensor = tf.reduce_mean(tf.cast(correct_tensor, tf.float32))
        # accuracy = accuracy_tensor.eval({ progression_label_placeholder: progression_labels, progression_placeholder: progressions })
        # print('Accuracy:', accuracy)

train_neural_network(progressions, progression_labels)
