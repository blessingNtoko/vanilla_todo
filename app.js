const express = require('express');
const bodyParse = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 4177;

app.use(bodyParse.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect(`mongodb://localhost:27017/todoListDB`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const itemsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Buy Pizza"
});

const item2 = new Item({
    name: "Clean House"
});

const item3 = new Item({
    name: "Study Code"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);


app.get('/', (req, res) => {

    Item.find({}, (err, foundItems) => {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`Items inserted successfully`);
                }
            });
            res.redirect('/')
        } else {

            res.render('list', {
                listTitle: 'Today',
                newListItems: foundItems
            });
        }

    });

});

app.get('/:customListName', (req, res) => {
    const customListName = req.params.customListName;

    List.findOne({
        name: customListName
    }, (err, results) => {
        if (err) {
            console.log(err);
        } else {
            if (!results) {
                // Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect(`/${customListName}`);
            } else {
                // Show an existing list
                res.render('list', {
                    listTitle: results.name,
                    newListItems: results.items
                });
            }
        }
    });

});

// ========================================================================= Posts ======================================================================

app.post('/', (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    let item = new Item({
        name: itemName
    });

    if (listName == 'Today') {    
            item.save();
            res.redirect('/');
    } else {
        List.findOne({name: listName}, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                result.items.push(item);
                result.save();
                res.redirect(`/${listName}`);
            }
        });
    }

});

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.deleteCheck;

    Item.findByIdAndRemove(checkedItemId, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Successfully removed item');
            res.redirect('/');
        }
    });
});




app.listen(process.env.PORT || port, () => {
    console.log(`Server listening on port ${port}`);
});