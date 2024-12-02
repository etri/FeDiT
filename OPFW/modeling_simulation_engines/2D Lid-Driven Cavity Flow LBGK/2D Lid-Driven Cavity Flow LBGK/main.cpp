#pragma once

#include <stdio.h>
#include <vector>
#include <glm/glm.hpp>
#include <sstream>
#include <time.h>

void func1();
void func2();
void func3();
void func4();
void func5();
void func6();
void func7();
void func8();
void func9();

std::vector<double>	ex = { 0.0,  1.0,  0.0, -1.0,  0.0,  1.0, -1.0, -1.0,  1.0 };
std::vector<double> ey = { 0.0,  0.0,  1.0,  0.0, -1.0,  1.0,  1.0, -1.0, -1.0 };
std::vector<int>	al1 = { 0,  1,  0, -1,  0,  1, -1, -1,  1 };
std::vector<int>	al2 = { 0,  0,  1,  0, -1,  1,  1, -1, -1 };
std::vector<int>	opd = { 0,  3,  4,  1,  2,  7,  8,  5,  6 };

glm::ivec2	T;
int iC;
int nC;
int AEQ;
double LatRefVelocity;
double LatRefLength;
double LatRefTime;
double RefVelocity;
double RefLength;
double Re;
int ZC;
int R;
double inflow;
double RR0;
double nu;
double tdd;
double Ustar;
double rd0;
double rux0;
double ruy0;
double rd00;
double rux00;
double ruy00;
int		start;
int		end;
int		result;
double	minres;


#define	DSS	9
#define SAVE_PATH		"D:/LBM Training/2D Lid-Driven Cavity Flow LBGK/Results/"
double D[DSS];

typedef struct DefAAVAL
{
	double		PD;
	double		PD0;
	glm::dvec2	CPT;
	glm::dvec2	U;
	glm::dvec2	U0;
	double		A[DSS];
	double		B[DSS];
	double		BB[DSS];
	double		S[DSS];
	double		theta;
	double		ReTheta;
	double		WSS;
	double		Cf;
	double		uplus;
	double		yplus;
	int			Wall;
	int			Wall0;
	int			BoundaryType;
	double		dudx;
	double		dudy;
	double		dvdx;
	double		dvdy;
	double		F1[DSS];
}DefNode;

std::vector<DefNode>	AA;

int main(int argc, char** argv)
{
	clock_t start, end;
	start = clock();

	T.x  = 101;
	T.y  = 101;
	ZC = 2000000;
	R = 1000;
	Re = 10.0;
	Ustar = 0.1;
	nu = Ustar / Re*((T.x - 1)*1.0);
	tdd = 3.0*nu + 0.5;

	RR0 = 1.0;

	func1();

	for (iC = 1; iC < ZC + 1; ++iC)
	{
		++nC;

		func4();
		func5();
		func6();
		func2();
		func3();
		func7();
		func8();
	}

	return 0;
}

void func1()
{
	AEQ = T.x*T.y;

	AA.resize(AEQ);

	for (int i = 0; i < DSS; ++i)	
	{
		if (i == 0)
			D[i] = 4.0 / 9.0;
		else if (i > 0 && i < 5)
			D[i] = 1.0 / 9.0;
		else
			D[i] = 1.0 / 36.0;
	}

#pragma omp parallel for
	for (int i = 0; i < AEQ; ++i)
	{
		int x = i / T.y;
		int y = i % T.y;
		
		AA[i].CPT = glm::dvec2(x, y);
	}

	for (int i = 0; i < AEQ; ++i)
	{
		AA[i].U = glm::dvec2(0.0, 0.0);
		AA[i].PD = RR0;
	}
	for (int x = 0; x < T.x-1; ++x)
	{
		int KBL = T.y*(x + 1) - 1;
		AA[KBL].U = glm::dvec2(0.1, 0.0);
	}


	for (int i = 0; i < AEQ; ++i)
	{
		for (int no = 0; no < DSS; ++no)
		{
			double eusc = (ex[no] * AA[i].U.x) + (ey[no] * AA[i].U.y);	
			AA[i].A[no] = AA[i].PD*D[no] * (1.0 + 3.0*eusc + 4.5*pow(eusc, 2) - 1.5*(pow(AA[i].U.x, 2) + pow(AA[i].U.y, 2)));
			AA[i].B[no] = AA[i].A[no];
		}
		AA[i].PD0 = AA[i].PD;
		AA[i].U0 = AA[i].U;
		AA[i].Wall0 = AA[i].Wall;
	}
	nC = 0;	
}


void func2()	
{
#pragma omp parallel for
	for (int i = 0; i < AEQ; ++i)
	{
		AA[i].PD = 0.0;		
		AA[i].U = glm::dvec2(0.0,0.0);	
		for (int j = 0; j < DSS; ++j)
		{
			AA[i].PD += AA[i].A[j];		
			AA[i].U.x += ex[j] * AA[i].A[j];	
			AA[i].U.y += ey[j] * AA[i].A[j];	
		}

		AA[i].U.x /= AA[i].PD;		
		AA[i].U.y /= AA[i].PD;		
	}

#pragma omp parallel for
	for (int i = 0; i < AEQ; ++i)
	{
		int right = i + T.y;
		int left = i - T.y;
		int up = i + 1;
		int down = i - 1;
	}
}

void func3()
{
	double rd = 0.0;		
	double rux = 0.0;
	double ruy = 0.0;
	double rd0 = 0.0;
	double rux0 = 0.0;
	double ruy0 = 0.0;

#pragma omp parallel for reduction(+:rd) reduction(+:rux) reduction(+:ruy)
	for (int i = 0; i < AEQ; ++i)
	{
		rd += (AA[i].PD - AA[i].PD0)*(AA[i].PD - AA[i].PD0);
		rux += (AA[i].U.x - AA[i].U0.x)*(AA[i].U.x - AA[i].U0.x);
		ruy += (AA[i].U.y - AA[i].U0.y)*(AA[i].U.y - AA[i].U0.y);
	}
	

	rd = std::sqrt(rd / AEQ);
	rux = std::sqrt(rux / AEQ);
	ruy = std::sqrt(ruy / AEQ);

	if (iC == 2)
	{
		rd00 = rd;
		rux00 = rux;
		ruy00 = ruy;
	}

	rd0 = rd / rd00;
	rux0 = rux / rux00;
	ruy0 = ruy / ruy00;


	minres = rux0;
	if (ruy0 > minres)
		minres = ruy0;
	if (rd0 > minres)
		minres = rd0;

	printf("%14.5e,%14.5e,%14.5e,%14.5e,%14.5e,%14.5e\n", rd, rux, ruy, rd0, rux0, ruy0);		

}

void func4()
{
#pragma omp parallel for
	for (int i = 0; i < AEQ; ++i)
	{
		for (int no = 0; no < DSS; ++no)
		{
			double eusc = (ex[no] * AA[i].U.x) + (ey[no] * AA[i].U.y);
			double usquare = pow(AA[i].U.x, 2) + pow(AA[i].U.y, 2);

			AA[i].BB[no] = D[no] * AA[i].PD*(1.0 + 3.0*eusc + 4.5*pow(eusc, 2) - 1.5*usquare);
		}
	}



#pragma omp parallel for
	for (int i = 0; i < AEQ; ++i)
	{
		double opi = 1.0;
		double amv = 2.0;
		double amv_2 = 9.0;
		for (int no = 0; no < DSS; ++no)
		{
			AA[i].B[no] = AA[i].B[no] - opi / tdd * (AA[i].B[no] - AA[i].BB[no]);
		}
	}
}

void func5()
{
#pragma omp parallel for
	for (int i = 0; i < AEQ; ++i)
	{
		for (int no = 0; no < DSS; ++no)
		{
			int xmpe = al1[no];
			int xmpy = al2[no];
			int id = (AA[i].CPT.y + xmpy) + (AA[i].CPT.x + xmpe)*(T.y*1.0);

			if (AA[i].CPT.x + xmpe < T.x && AA[i].CPT.y + xmpy < T.y &&
				AA[i].CPT.x + xmpe >= 0 && AA[i].CPT.y + xmpy >= 0)		
			{
				AA[id].A[no] = AA[i].B[no];
			}
		}
	}
}

void func6()
{
#pragma omp parallel for
	for (int y = 1; y < T.y-1; ++y)
	{
		for (int no = 0; no < DSS; ++no)
		{
			int oidx = opd[no];
			int xmpe = al1[no];
			int xmpy = al2[no];
			if (-xmpe > 0)		
			{					
				int KBL = y;		
								
								
				AA[KBL].A[oidx] = AA[KBL].A[no];
				
			}
		}
	}

#pragma omp parallel for
	for (int y = 1; y < T.y-1; ++y)
	{
		for (int no = 0; no < DSS; ++no)
		{
			int oidx = opd[no];
			int xmpe = al1[no];
			int xmpy = al2[no];
			if (xmpe > 0 )
			{
				int KBL = AEQ - y - 1;
				AA[KBL].A[oidx] = AA[KBL].A[no];
			}
		}
	}

#pragma omp parallel for
	for (int x = 1; x < T.x-1; ++x)
	{
		for (int no = 0; no < DSS; ++no)
		{
			int oidx = opd[no];
			int xmpe = al1[no];
			int xmpy = al2[no];
			if (-xmpy > 0)
			{
				int KBL = T.y*x;
				AA[KBL].A[oidx] = AA[KBL].A[no];
			}
		}
	}

#pragma omp parallel for
	for (int x = 1; x < T.x-1; ++x)
	{
		int KBL = T.y * (x + 1) - 1;
		int innerKBL = T.y * (x + 1) - 2;
		AA[KBL].PD = 2.0 * (AA[KBL].A[2] + AA[KBL].A[5] + AA[KBL].A[6]) + AA[KBL].A[3] + AA[KBL].A[0] + AA[KBL].A[1];
		for (int no = 0; no < DSS; ++no)
		{
			int oidx = opd[no];
			int xmpe = al1[no];
			int xmpy = al2[no];

			if (xmpy > 0)
			{
				AA[KBL].A[oidx] = AA[KBL].B[no] - 6.0 * AA[KBL].PD * D[no] * Ustar * ex[no];
			}
		}
	}

}

void func9()
{
	AA[T.y - 1].A[4] = AA[T.y - 1].B[2];
	AA[T.y - 1].A[1] = AA[T.y - 1].B[3];
	AA[T.y - 1].A[8] = AA[T.y - 1].B[6];

	AA[AEQ - 1].A[4] = AA[AEQ - 1].B[2];
	AA[AEQ - 1].A[7] = AA[AEQ - 1].B[5];
	AA[AEQ - 1].A[3] = AA[AEQ - 1].B[1];

	AA[0].A[2] = AA[0].B[4];
	AA[0].A[1] = AA[0].B[3];
	AA[0].A[5] = AA[0].B[7];

	AA[AEQ - T.y].A[2] = AA[AEQ - T.y].B[4];
	AA[AEQ - T.y].A[3] = AA[AEQ - T.y].B[1];
	AA[AEQ - T.y].A[6] = AA[AEQ - T.y].B[8];

}


void func7()
{
#pragma omp parallel for
	for (int i = 0; i < AEQ; ++i)
	{
		AA[i].PD0 = AA[i].PD;
		AA[i].U0 = AA[i].U;
		AA[i].Wall0 = AA[i].Wall;
	}
}

void func8()
{

	end = clock();
	result = (end - start);
	printf("%d", result);


	if (nC % R == 0)
	{
		printf("Writing output file...\n");
		char name[1024] = {};
		sprintf(name, "%sOutput%04d.dat", SAVE_PATH, nC / R);
		FILE*pFile = fopen(name, "wt");

		if (pFile == nullptr)
		{
			exit(0);
		}
		fprintf(pFile, "%s\n", "variables=x,y,rho, U, V");
		fprintf(pFile, "zone i=\t%d,j=\t%d\n", T.y, T.x);

		for (int x = 0; x < T.x; ++x)
		{
			for (int y = 0; y < T.y; ++y)
			{
				int id = y + x*T.y;

				fprintf(pFile, "%d\t %d\t %lf\t %lf\t %lf\t \n",
					x, y, AA[id].PD, AA[id].U.x, AA[id].U.y);
			}
		}
		fclose(pFile);
	}
}