const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name="productId"]').value;
    const csrf = btn.parentNode.querySelector('[name="_csrf"]').value;

    console.log('productId: '+productId)
    console.log('csrf: '+csrf)

    const productElement = btn.closest('article');

    fetch('/admin/product/' + productId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(response => {
        return response.json();
    })
    .then(dataResponse => {
        console.log(dataResponse)
        productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
        console.log(err)
    });
}