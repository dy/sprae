
export default el => value => {for (let key in value) el.dataset[key] = value[key];}
