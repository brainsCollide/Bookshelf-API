const Hapi = require('@hapi/hapi');
const { v4 } = require('uuid');

const server = Hapi.server({
    port: 9000,
    host: 'localhost'
});

let books = []

server.route({
    method: 'GET',
    path: '/books',
    handler: (request, h) => {
        const { name, reading, finished } = request.query;

        let filteredBooks = books;
        if (name) {
            filteredBooks = filteredBooks.filter(book =>
                book.name.toLowerCase().includes(name.toLowerCase())
            );
        }

        if (reading !== undefined) {
            filteredBooks = filteredBooks.filter(book => {
                if (reading === '1' || reading === 'true') {
                    return book.readPage > 0 && book.readPage < book.pageCount;
                } else if (reading === '0' || reading === 'false') {
                    return book.readPage === 0 || book.readPage === book.pageCount;
                }
                return false;
            });
        }

        if (finished !== undefined) {
            filteredBooks = filteredBooks.filter(book => {
                if (finished === '1' || finished === 'true') {
                    return book.finished;
                } else if (finished === '0' || finished === 'false') {
                    return !book.finished;
                }
                return false;
            });
        }

        console.log('Filtered Books:', filteredBooks);

        const displayBooks = filteredBooks.map(book => ({
            id: book.id,
            name: book.name,
            publisher: book.publisher
        }));

        return h.response({
            status: 'success',
            data: {
                books: displayBooks,
            }
        }).code(200);
    }
});


server.route({
    method: 'POST',
    path: '/books',
    handler: (request, h) => {
        const book = request.payload;
        
        if(!book.name){
            return h.response({ 
                status: 'fail',
                message: 'Gagal menambahkan buku. Mohon isi nama buku'
            }).code(400);
        }

        if(book.readPage > book.pageCount){
            return h.response({ 
                status: 'fail',
                message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount'
            }).code(400);
        }

        book.finished = book.readPage === book.pageCount;

        book.id = v4();
        book.insertedAt = new Date().toISOString();
        book.updatedAt = new Date().toISOString();

        books.push(book);
        return h.response({
            status: 'success',
            message: 'Buku berhasil ditambahkan',
            data: {
                bookId: book.id
            }
        }).code(201);
    }
});


server.route({
    method: 'GET',
    path: '/books/{bookId}',
    handler: (request, h) => {
        const { bookId } = request.params;
        const book = books.find((b) => b.id === bookId);

        if(!book) {
            return h.response({
                status: 'fail',
                message: 'Buku tidak ditemukan'
            }).code(404);
        }
        
        return h.response({
            status: 'success',
            data: {
                book
            }
        }).code(200);
    }      
})

server.route({
    method: 'PUT',
    path: '/books/{bookId}',
    handler: (request, h) => {
        const { bookId } = request.params;
        const updatedBook = request.payload;
        const index = books.findIndex((b) => b.id === bookId);

    
        if (!updatedBook.name) {
            return h.response({ 
                status: 'fail',
                message: 'Gagal memperbarui buku. Mohon isi nama buku'
            }).code(400);
        }

        if (index !== -1) {
            if (updatedBook.readPage > updatedBook.pageCount) {
                return h.response({
                    status: 'fail',
                    message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount'
                }).code(400);
            }

            books[index] = {
                ...books[index],
                ...updatedBook,
                finished: updatedBook.readPage === updatedBook.pageCount,
                updatedAt: new Date().toISOString()
            };
            return h.response({
                status: 'success',
                message: 'Buku berhasil diperbarui'
            }).code(200);
        } else {
            return h.response({
                status: 'fail',
                message: 'Gagal memperbarui buku. Id tidak ditemukan'
            }).code(404);
        }
    }
});

server.route({ 
    method: 'DELETE',
    path: '/books/{bookId}',
    handler: (request, h) => {
        const {bookId} = request.params;
        const index = books.findIndex((b) => b.id === bookId);

        if(index !== -1){
            books.splice(index, 1);
            return h.response({
                status: 'success',
                message: 'Buku berhasil dihapus'
            }).code(200);
        } else {
            return h.response({
                status: 'fail',
                message: 'Buku gagal dihapus. Id tidak ditemukan'
            }).code(404);
        }
       
    }
});



const start = async () => {
    await server.start();
    try {
        console.log('Server running on %s', server.info.uri);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

start();