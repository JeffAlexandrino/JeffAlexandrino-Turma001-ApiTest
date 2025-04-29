import pactum from 'pactum';
import { like, string } from 'pactum-matchers';
import { StatusCodes } from 'http-status-codes';
import { SimpleReporter } from '../simple-reporter';
import { faker } from '@faker-js/faker';

describe('Toolshop API', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://api.practicesoftwaretesting.com';

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe('Categories', () => {
    let createdCategoryId: number;
    let createdCategoryName: string;

    it('1. Get All Categories', async () => {
      await p
        .spec()
        .get(`${baseUrl}/categories`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike([
          {
            id: like('string'),
            name: string(),
            slug: string()
          }
        ]);
    });

    it('2. Create New Category', async () => {
      createdCategoryName = faker.commerce.department();
      const categorySlug = faker.helpers.slugify(
        createdCategoryName.toLowerCase()
      );

      const res = await p
        .spec()
        .post(`${baseUrl}/categories`)
        .withJson({
          name: createdCategoryName,
          slug: categorySlug
        })
        .expectStatus(StatusCodes.CREATED);

      createdCategoryId = res.body.id;
      expect(createdCategoryId).toBeDefined();
    });

    it('3. Create Category with Existing Name', async () => {
      // Tenta criar uma categoria com o mesmo nome e slug de uma já existente
      const categorySlug = faker.helpers.slugify(
        createdCategoryName.toLowerCase()
      );

      await p
        .spec()
        .post(`${baseUrl}/categories`)
        .withJson({
          name: createdCategoryName, // Nome já existente
          slug: categorySlug // Slug já existente
        })
        .expectStatus(StatusCodes.BAD_REQUEST) // Espera erro 400 ou similar
        .expectJsonLike({
          message: like('Category with this name or slug already exists')
        });
    });

    it('4. Update Category', async () => {
      const newName = faker.commerce.department();
      const newSlug = faker.helpers.slugify(newName.toLowerCase());

      const updateResponse = await p
        .spec()
        .put(`${baseUrl}/categories/${createdCategoryId}`)
        .withJson({
          name: newName,
          slug: newSlug
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          name: newName,
          slug: newSlug
        });

      // Atualiza os valores locais para refletir a mudança
      createdCategoryName = newName;

      console.log('Update Response:', updateResponse.body);
    });

    it('5. Delete Created Category', async () => {
      // Deleta a categoria criada
      await p
        .spec()
        .delete(`${baseUrl}/categories/${createdCategoryId}`)
        .expectStatus(StatusCodes.OK);

      await p
        .spec()
        .get(`${baseUrl}/categories/${createdCategoryId}`)
        .expectStatus(StatusCodes.NOT_FOUND);
    });

    it('6. Get Non-Existent Category', async () => {
      await p
        .spec()
        .get(`${baseUrl}/categories/999999`)
        .expectStatus(StatusCodes.METHOD_NOT_ALLOWED);
    });

    it('7. Get Categories Tree', async () => {
      await p
        .spec()
        .get(`${baseUrl}/categories/tree`)
        .expectStatus(StatusCodes.OK);
    });

    it('8. Get Category Tree by ID (inexistente)', async () => {
      await p
        .spec()
        .get(`${baseUrl}/categories/tree/999999`)
        .expectStatus(StatusCodes.NOT_FOUND);
    });

    it('9. Search Categories', async () => {
      await p
        .spec()
        .get(`${baseUrl}/categories/search`)
        .withQueryParams('query', 'tools')
        .expectStatus(StatusCodes.OK);
    });

    it('10. Patch Category (parcial)', async () => {
      // Criação de uma nova categoria para o teste
      const name = faker.commerce.department();
      const slug = faker.helpers.slugify(name.toLowerCase());

      const createResponse = await p
        .spec()
        .post(`${baseUrl}/categories`)
        .withJson({ name, slug })
        .expectStatus(StatusCodes.CREATED);

      // Validação do ID retornado
      const patchCategoryId = createResponse.body.id;
      expect(patchCategoryId).toBeDefined();

      // Atualização parcial da categoria
      const newName = faker.commerce.department();

      const patchResponse = await p
        .spec()
        .patch(`${baseUrl}/categories/${patchCategoryId}`)
        .withJson({ name: newName })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ name: newName });

      
      console.log('Patch Response:', patchResponse.body);

      
      expect(patchResponse.body.name).toBe(newName);
    });
  });
});
