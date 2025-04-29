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
            id: like(1),
            name: string(),
            slug: string()
          }
        ]);
    });

    it('2. Create New Category', async () => {
      createdCategoryName = faker.commerce.department();
      const categorySlug = faker.helpers.slugify(createdCategoryName.toLowerCase());

      const res = await p
        .spec()
        .post(`${baseUrl}/categories`)
        .withJson({
          name: createdCategoryName,
          slug: categorySlug
        })
        .expectStatus(StatusCodes.CREATED);

      createdCategoryId = res.body.id;
    });

    it('3. Get Created Category By ID', async () => {
      await p
        .spec()
        .get(`${baseUrl}/categories/${createdCategoryId}`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: createdCategoryId,
          name: string(),
          slug: string()
        });
    });

    it('4. Update Category', async () => {
      const newName = faker.commerce.department();
      const newSlug = faker.helpers.slugify(newName.toLowerCase());

      await p
        .spec()
        .put(`${baseUrl}/categories/${createdCategoryId}`)
        .withJson({
          name: newName,
          slug: newSlug
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: createdCategoryId,
          name: newName,
          slug: newSlug
        });

      createdCategoryName = newName; 
    });

    it('5. Delete Created Category', async () => {
      await p
        .spec()
        .delete(`${baseUrl}/categories/${createdCategoryId}`)
        .expectStatus(StatusCodes.NO_CONTENT);

      await p
        .spec()
        .get(`${baseUrl}/categories/${createdCategoryId}`)
        .expectStatus(StatusCodes.NOT_FOUND);
    });

    it('6. Get Non-Existent Category', async () => {
      await p
        .spec()
        .get(`${baseUrl}/categories/999999`)
        .expectStatus(StatusCodes.NOT_FOUND);
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
        .withQueryParams('query', 'tools') // Altere o termo conforme desejado
        .expectStatus(StatusCodes.OK);
    });

    it('10. Patch Category (parcial)', async () => {
      // Cria uma categoria para teste do PATCH
      const name = faker.commerce.department();
      const slug = faker.helpers.slugify(name.toLowerCase());

      const res = await p
        .spec()
        .post(`${baseUrl}/categories`)
        .withJson({ name, slug })
        .expectStatus(StatusCodes.CREATED);

      const patchCategoryId = res.body.id;

      const newName = faker.commerce.department();

      await p
        .spec()
        .patch(`${baseUrl}/categories/${patchCategoryId}`)
        .withJson({ name: newName })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ name: newName });

      await p
        .spec()
        .delete(`${baseUrl}/categories/${patchCategoryId}`)
        .expectStatus(StatusCodes.NO_CONTENT);
    });
  });
});
